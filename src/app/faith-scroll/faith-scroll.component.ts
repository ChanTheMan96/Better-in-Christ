import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { FAITH_SCROLL_CATEGORIES, FaithScrollCategory } from '../data/faith-scroll.data';
import { GROWTH_TRAITS } from '../data/growth.data';
import { MENS_HELP_EMOTIONS } from '../data/mens-help-emotions.data';
import { BibleService } from '../services/bible.service';

interface FaithScrollVerse {
  reference: string;
  text: string;
  version: string;
  loaded: boolean;
}

interface FaithScrollCategoryGroup {
  label: string;
  categories: FaithScrollCategory[];
}

@Component({
  selector: 'app-faith-scroll',
  templateUrl: './faith-scroll.component.html',
  styleUrls: ['./faith-scroll.component.scss']
})
export class FaithScrollComponent implements OnInit, OnDestroy {
  @ViewChild('feed') feed?: ElementRef<HTMLElement>;

  private readonly emotionCategories: FaithScrollCategory[] = MENS_HELP_EMOTIONS.map((emotion) => ({
    name: emotion.emotion,
    refs: emotion.keywordVerses
  }));
  private readonly growthCategories: FaithScrollCategory[] = GROWTH_TRAITS.map((trait) => ({
    name: trait.emotion,
    refs: trait.keywordVerses
  }));
  private readonly featuredCategories: FaithScrollCategory[] = [
    {
      name: 'All Scripture',
      refs: [
        ...FAITH_SCROLL_CATEGORIES.flatMap((category) => category.refs),
        ...this.emotionCategories.flatMap((category) => category.refs),
        ...this.growthCategories.flatMap((category) => category.refs)
      ]
    },
    ...FAITH_SCROLL_CATEGORIES
  ];

  readonly categoryGroups: FaithScrollCategoryGroup[] = [
    { label: 'Featured', categories: this.featuredCategories },
    { label: 'Emotions', categories: this.emotionCategories },
    { label: 'Growth', categories: this.growthCategories }
  ];
  readonly categories: FaithScrollCategory[] = this.categoryGroups.flatMap((group) => group.categories);
  selectedCategory = 'Faith';
  verses: FaithScrollVerse[] = [];
  loading = true;
  activeIndex = 0;
  favoriteRefs = new Set<string>();

  private readonly destroy$ = new Subject<void>();
  private inFlightRefs = new Set<string>();
  private seenRefs = new Set<string>();
  private loadToken = 0;

  constructor(
    private bibleService: BibleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.favoriteRefs = this.readFavorites();
    this.selectedCategory = localStorage.getItem('faithScrollCategory') || 'Faith';
    this.loadCategory(this.selectedCategory);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  onCategoryChange(categoryName: string): void {
    this.loadCategory(categoryName);
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
    if (this.favoriteRefs.has(verse.reference)) {
      this.favoriteRefs.delete(verse.reference);
    } else {
      this.favoriteRefs.add(verse.reference);
    }
    localStorage.setItem('faithScrollFavorites', JSON.stringify([...this.favoriteRefs]));
    this.pulse();
  }

  async shareVerse(verse: FaithScrollVerse): Promise<void> {
    const shareText = `${verse.text}\n\n${verse.reference}${verse.version ? ` (${verse.version})` : ''}`;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

    if (nav.share) {
      await nav.share({ title: verse.reference, text: shareText }).catch(() => undefined);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText).catch(() => undefined);
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

  private loadCategory(categoryName: string): void {
    const category = this.findCategory(categoryName);
    this.loadToken += 1;
    const token = this.loadToken;
    const refs = this.shuffleRefs(this.uniqueRefs(category.refs));

    this.selectedCategory = category.name;
    this.loading = true;
    this.inFlightRefs.clear();
    this.seenRefs.clear();
    this.verses = refs.map((ref) => ({
      reference: ref,
      text: 'Loading Scripture...',
      version: '',
      loaded: false
    }));
    this.activeIndex = 0;
    localStorage.setItem('faithScrollCategory', category.name);

    if (!this.verses.length) {
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
        map((passage) => ({
          reference: passage.reference || requestedRef,
          text: this.bibleService.formatPassageQuote(passage),
          version: passage.translation_name || passage.translation_id || '',
          loaded: true
        })),
        catchError(() => of({
          reference: requestedRef,
          text: 'Unable to load this verse right now. Try again in a moment.',
          version: '',
          loaded: true
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

  private readFavorites(): Set<string> {
    try {
      const raw = JSON.parse(localStorage.getItem('faithScrollFavorites') || '[]');
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
}
