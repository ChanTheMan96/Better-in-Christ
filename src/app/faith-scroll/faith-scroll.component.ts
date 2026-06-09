import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { FAITH_SCROLL_CATEGORIES, FaithScrollCategory } from '../data/faith-scroll.data';
import { EMOTIONS } from '../data/emotions.data';
import { GROWTH_TRAITS } from '../data/growth.data';
import {
  FAITH_SCROLL_FAVORITES_CATEGORY,
  FaithScrollCategoryGroup,
  FaithScrollSelectionService
} from '../services/faith-scroll-selection.service';
import { BibleService } from '../services/bible.service';

interface FaithScrollVerse {
  reference: string;
  text: string;
  version: string;
  loaded: boolean;
  error?: boolean;
}

const FAVORITES_STORAGE_KEY = 'faithScrollFavorites';

@Component({
    selector: 'app-faith-scroll',
    templateUrl: './faith-scroll.component.html',
    styleUrls: ['./faith-scroll.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FaithScrollComponent implements OnInit, OnDestroy {
  @ViewChild('feed') feed?: ElementRef<HTMLElement>;

  categories: FaithScrollCategory[] = [];
  selectedCategory = 'Faith';
  verses: FaithScrollVerse[] = [];
  loading = true;
  activeIndex = 0;
  favoriteRefs = new Set<string>();
  toastMessage = '';
  emptyMessage = '';

  private readonly destroy$ = new Subject<void>();
  private inFlightRefs = new Set<string>();
  private seenRefs = new Set<string>();
  private loadToken = 0;
  private cardTouchStartY: number | null = null;
  private toastTimeoutId: number | null = null;

  constructor(
    private bibleService: BibleService,
    private selection: FaithScrollSelectionService
  ) {}

  ngOnInit(): void {
    this.favoriteRefs = this.readFavorites();
    this.selection.setCategoryGroups(this.buildCategoryGroups());
    this.categories = this.selection.categories;
    this.selection.resetToFaith();
    this.selection.selected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((categoryName) => {
        this.selectedCategory = categoryName;
        this.loadCategory(categoryName);
      });
  }

  ngOnDestroy(): void {
    if (this.toastTimeoutId !== null) {
      window.clearTimeout(this.toastTimeoutId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFeedScroll(): void {
    const el = this.feed?.nativeElement;
    if (!el) return;

    const nextIndex = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
    if (nextIndex !== this.activeIndex) {
      this.activeIndex = Math.max(0, Math.min(nextIndex, this.verses.length - 1));
      this.markSeen(this.activeIndex);
      this.loadVerseWindow(this.activeIndex);
      this.pulse();
    }
  }

  toggleFavorite(verse: FaithScrollVerse): void {
    if (verse.error) return;

    if (this.favoriteRefs.has(verse.reference)) {
      this.favoriteRefs.delete(verse.reference);
      this.showToast('Removed');
    } else {
      this.favoriteRefs.add(verse.reference);
      this.showToast('Saved');
    }
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...this.favoriteRefs]));
    if (this.selectedCategory === FAITH_SCROLL_FAVORITES_CATEGORY) {
      this.removeUnfavoritedFromFavoritesFeed();
    }
    this.pulse();
  }

  async shareVerse(verse: FaithScrollVerse): Promise<void> {
    if (verse.error) return;

    const shareText = `${verse.text}\n\n${verse.reference}${verse.version ? ` (${verse.version})` : ''}\n\nbetterinchrist.com`;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

    if (nav.share) {
      await nav.share({ title: verse.reference, text: shareText }).catch(() => undefined);
      this.showToast('Shared');
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText).catch(() => undefined);
      this.showToast('Copied');
    }
    this.pulse();
  }

  randomVerse(): void {
    if (!this.verses.length) return;
    const unseenIndexes = this.verses
      .map((verse, index) => ({ verse, index }))
      .filter(({ verse, index }) => !this.seenRefs.has(verse.reference) && index !== this.activeIndex)
      .map(({ index }) => index);
    const candidates = unseenIndexes.length
      ? unseenIndexes
      : this.verses.map((_, index) => index).filter((index) => index !== this.activeIndex);
    const nextIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
    this.scrollToIndex(nextIndex);
  }

  retrySelection(): void {
    this.loadCategory(this.selectedCategory);
  }

  retryVerse(index: number): void {
    const verse = this.verses[index];
    if (!verse) return;

    this.inFlightRefs.delete(verse.reference);
    this.verses[index] = {
      reference: verse.reference,
      text: 'Loading Scripture...',
      version: '',
      loaded: false
    };
    this.loadVerse(index);
  }

  getVerseLengthClass(verse: FaithScrollVerse): string {
    if (verse.error || !verse.loaded) return '';
    const length = verse.text.length;
    if (length <= 135) return 'is-short-verse';
    if (length <= 240) return 'is-medium-verse';
    return 'is-long-verse';
  }

  onVerseCardTouchStart(event: TouchEvent): void {
    this.cardTouchStartY = event.touches[0]?.clientY ?? null;
  }

  onVerseCardTouchEnd(event: TouchEvent): void {
    if (this.cardTouchStartY === null) return;

    const card = event.currentTarget as HTMLElement | null;
    const endY = event.changedTouches[0]?.clientY ?? this.cardTouchStartY;
    const deltaY = endY - this.cardTouchStartY;
    this.cardTouchStartY = null;

    if (!card || Math.abs(deltaY) < 36) return;

    if (deltaY < 0 && this.isScrolledToBottom(card)) {
      event.preventDefault();
      this.scrollToIndex(this.activeIndex + 1);
    } else if (deltaY > 0 && this.isScrolledToTop(card)) {
      event.preventDefault();
      this.scrollToIndex(this.activeIndex - 1);
    }
  }

  onVerseCardWheel(event: WheelEvent): void {
    const card = event.currentTarget as HTMLElement | null;
    if (!card || Math.abs(event.deltaY) < 4) return;

    if (event.deltaY > 0 && this.isScrolledToBottom(card)) {
      event.preventDefault();
      this.scrollToIndex(this.activeIndex + 1);
    } else if (event.deltaY < 0 && this.isScrolledToTop(card)) {
      event.preventDefault();
      this.scrollToIndex(this.activeIndex - 1);
    }
  }

  private loadCategory(categoryName: string): void {
    const category = this.findCategory(categoryName);
    this.loadToken += 1;
    const token = this.loadToken;
    const refs = this.shuffleRefs(this.getCategoryRefs(category));

    this.selectedCategory = category.name;
    this.loading = true;
    this.emptyMessage = '';
    this.inFlightRefs.clear();
    this.seenRefs.clear();
    this.verses = refs.map((ref) => ({
      reference: ref,
      text: 'Loading Scripture...',
      version: '',
      loaded: false,
      error: false
    }));
    this.activeIndex = 0;

    if (!this.verses.length) {
      this.emptyMessage = category.name === FAITH_SCROLL_FAVORITES_CATEGORY
        ? 'Heart verses to build your Favorites scroll.'
        : 'No verses found for this selection.';
      this.loading = false;
      return;
    }

    setTimeout(() => {
      this.scrollToIndex(0, 'auto', token);
      this.loadVerseWindow(this.activeIndex, token);
    });
  }

  private findCategory(categoryName: string): FaithScrollCategory {
    return this.categories.find((category) => category.name === categoryName) || this.categories[0];
  }

  private buildCategoryGroups(): FaithScrollCategoryGroup[] {
    const emotionCategories: FaithScrollCategory[] = EMOTIONS.map((emotion) => ({
      name: emotion.emotion,
      refs: emotion.keywordVerses
    }));
    const growthCategories: FaithScrollCategory[] = GROWTH_TRAITS.map((trait) => ({
      name: trait.emotion,
      refs: trait.keywordVerses
    }));
    const featuredCategories: FaithScrollCategory[] = [
      {
        name: FAITH_SCROLL_FAVORITES_CATEGORY,
        refs: []
      },
      {
        name: 'All Scripture',
        refs: [
          ...FAITH_SCROLL_CATEGORIES.flatMap((category) => category.refs),
          ...emotionCategories.flatMap((category) => category.refs),
          ...growthCategories.flatMap((category) => category.refs)
        ]
      },
      ...FAITH_SCROLL_CATEGORIES
    ];

    return [
      { label: 'Featured', categories: featuredCategories },
      { label: 'Emotions', categories: emotionCategories },
      { label: 'Growth', categories: growthCategories }
    ];
  }

  private getCategoryRefs(category: FaithScrollCategory): string[] {
    if (category.name === FAITH_SCROLL_FAVORITES_CATEGORY) {
      this.favoriteRefs = this.readFavorites();
      return this.uniqueRefs([...this.favoriteRefs]);
    }
    return this.uniqueRefs(category.refs);
  }

  private loadVerseWindow(centerIndex: number, token = this.loadToken): void {
    for (let index = centerIndex - 1; index <= centerIndex + 4; index += 1) {
      this.loadVerse(index, token);
    }
  }

  private loadVerse(index: number, token = this.loadToken): void {
    const verse = this.verses[index];
    if (!verse || verse.loaded || this.inFlightRefs.has(verse.reference)) return;

    const requestedRef = verse.reference;
    this.inFlightRefs.add(requestedRef);

    this.bibleService.getPassage(requestedRef)
      .pipe(
        map((passage) => {
          const text = this.bibleService.formatPassageQuote(passage).trim();
          if (!text) {
            throw new Error('Empty passage');
          }

          return {
            reference: passage.reference || requestedRef,
            text,
            version: passage.translation_name || passage.translation_id || '',
            loaded: true,
            error: false
          };
        }),
        catchError(() => of({
          reference: requestedRef,
          text: 'This verse did not load.',
          version: '',
          loaded: true,
          error: true
        })),
        takeUntil(this.destroy$)
      )
      .subscribe((loadedVerse) => {
        this.inFlightRefs.delete(requestedRef);
        if (token !== this.loadToken || this.verses[index]?.reference !== requestedRef) return;

        this.verses[index] = loadedVerse;
        if (index === this.activeIndex) {
          this.loading = false;
        }
      });
  }

  private scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth', token = this.loadToken): void {
    const el = this.feed?.nativeElement;
    if (!el) return;

    const safeIndex = Math.max(0, Math.min(index, this.verses.length - 1));
    el.scrollTo({ top: safeIndex * el.clientHeight, behavior });
    this.activeIndex = safeIndex;
    this.markSeen(safeIndex);
    this.loadVerseWindow(safeIndex, token);
    this.pulse();
  }

  private isScrolledToBottom(el: HTMLElement): boolean {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
  }

  private isScrolledToTop(el: HTMLElement): boolean {
    return el.scrollTop <= 2;
  }

  private uniqueRefs(refs: string[]): string[] {
    return [...new Set(refs.map((ref) => ref.trim()).filter(Boolean))];
  }

  private shuffleRefs(refs: string[]): string[] {
    const shuffled = [...refs];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  private markSeen(index: number): void {
    const verse = this.verses[index];
    if (verse) this.seenRefs.add(verse.reference);
  }

  private removeUnfavoritedFromFavoritesFeed(): void {
    const currentRef = this.verses[this.activeIndex]?.reference;
    this.verses = this.verses.filter((verse) => this.favoriteRefs.has(verse.reference));
    this.emptyMessage = this.verses.length ? '' : 'Heart verses to build your Favorites scroll.';
    if (!this.verses.length) {
      this.activeIndex = 0;
      return;
    }

    const currentIndex = currentRef ? this.verses.findIndex((verse) => verse.reference === currentRef) : -1;
    this.activeIndex = Math.max(0, currentIndex);
    setTimeout(() => this.scrollToIndex(this.activeIndex, 'auto'));
  }

  private readFavorites(): Set<string> {
    try {
      const raw = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  }

  private pulse(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate?.(8);
    }
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimeoutId !== null) {
      window.clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = window.setTimeout(() => {
      this.toastMessage = '';
      this.toastTimeoutId = null;
    }, 1300);
  }
}
