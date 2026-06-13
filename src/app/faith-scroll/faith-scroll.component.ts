import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  skip,
  takeUntil,
} from 'rxjs/operators';
import {
  FAITH_SCROLL_CATEGORIES,
  FaithScrollCategory,
  JESUS_WORDS_CATEGORY,
  WHO_I_AM_ACCEPTED_CATEGORY,
  WHO_I_AM_CATEGORIES,
  WHO_I_AM_IN_CHRIST_CATEGORY,
  WHO_I_AM_SECURE_CATEGORY,
  WHO_I_AM_SIGNIFICANT_CATEGORY,
} from '../data/faith-scroll.data';
import { EMOTIONS } from '../data/emotions.data';
import { GROWTH_TRAITS } from '../data/growth.data';
import {
  FAITH_SCROLL_FAVORITES_CATEGORY,
  FaithScrollCategoryGroup,
  FaithScrollSelectionService,
} from '../services/faith-scroll-selection.service';
import { ApiService } from '../services/api.service';
import { BibleService } from '../services/bible.service';
import { BibleVersionService } from '../services/bible-version.service';
import { ClerkService } from '../services/clerk.service';
import { UserBattlesService } from '../services/user-battles.service';

interface FaithScrollVerse {
  reference: string;
  text: string;
  version: string;
  loaded: boolean;
  error?: boolean;
  sectionTitle?: string;
  staticText?: boolean;
}

interface SavedVerse {
  id: number;
  verseRef: string;
  verseText: string;
}

interface ScrollChip {
  label: string;
  categoryName: string;
}

interface ScrollChipGroup {
  label: string;
  chips: ScrollChip[];
}

@Component({
  selector: 'app-faith-scroll',
  templateUrl: './faith-scroll.component.html',
  styleUrls: ['./faith-scroll.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class FaithScrollComponent implements OnInit, OnDestroy {
  @ViewChild('feed') feed?: ElementRef<HTMLElement>;

  categories: FaithScrollCategory[] = [];
  selectedCategory = 'Faith';
  verses: FaithScrollVerse[] = [];
  loading = true;
  activeIndex = 0;
  favoriteRefs = new Set<string>();
  savedVerses: SavedVerse[] = [];
  toastMessage = '';
  emptyMessage = '';
  user: any = null;
  dbUser: any = null;
  categoryGroups: FaithScrollCategoryGroup[] = [];
  moreCategoriesOpen = false;
  identityChipsOpen = false;
  moreChipGroups: ScrollChipGroup[] = [];
  readonly identityParentCategory = WHO_I_AM_IN_CHRIST_CATEGORY;
  readonly identityChips: ScrollChip[] = [
    { label: 'Accepted', categoryName: WHO_I_AM_ACCEPTED_CATEGORY },
    { label: 'Secure', categoryName: WHO_I_AM_SECURE_CATEGORY },
    { label: 'Significant', categoryName: WHO_I_AM_SIGNIFICANT_CATEGORY },
  ];
  primaryChips: ScrollChip[] = [
    { label: 'Anxiety', categoryName: 'Anxiety' },
    { label: 'Shame', categoryName: 'Shame & Guilt' },
  ];

  private readonly destroy$ = new Subject<void>();
  private inFlightRefs = new Set<string>();
  private seenRefs = new Set<string>();
  private savedVerseIdByRef = new Map<string, number>();
  private loadToken = 0;
  private cardTouchStartY: number | null = null;
  private toastTimeoutId: number | null = null;

  constructor(
    private bibleService: BibleService,
    private bibleVersions: BibleVersionService,
    private selection: FaithScrollSelectionService,
    private clerkService: ClerkService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private userBattlesService: UserBattlesService,
  ) {}

  ngOnInit(): void {
    this.bootstrapUserAndFavorites();

    this.clerkService.authState$
      .pipe(
        map((state) => state.isSignedIn),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.bootstrapUserAndFavorites();
      });

    this.categoryGroups = this.buildCategoryGroups();
    this.selection.setCategoryGroups(this.categoryGroups);
    this.categories = this.selection.categories;
    this.moreChipGroups = this.buildMoreChipGroups();
    this.selection.select(this.getInitialScrollCategory());
    this.selection.selected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((categoryName) => {
        this.selectedCategory = categoryName;
        this.loadCategory(categoryName);
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const categoryName = this.normalizeScrollCategory(params.get('scroll'));
        if (categoryName && categoryName !== this.selection.selected) {
          this.selection.select(categoryName);
        }
      });

    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), skip(1), takeUntil(this.destroy$))
      .subscribe(() => this.loadCategory(this.selectedCategory));
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
      this.activeIndex = Math.max(
        0,
        Math.min(nextIndex, this.verses.length - 1),
      );
      this.markSeen(this.activeIndex);
      this.loadVerseWindow(this.activeIndex);
      this.pulse();
    }
  }

  toggleFavorite(verse: FaithScrollVerse): void {
    this.saveVerse(verse);
  }

  async saveVerse(verse: FaithScrollVerse): Promise<void> {
    if (verse.error || !verse.reference) return;

    if (this.favoriteRefs.has(verse.reference)) {
      const savedId = this.savedVerseIdByRef.get(verse.reference);
      if (savedId) {
        await this.removeVerse(savedId, verse.reference);
      } else {
        // If we do not have an id locally, refresh from API before deciding.
        await this.loadSavedVerses();
        const refreshedId = this.savedVerseIdByRef.get(verse.reference);
        if (refreshedId) {
          await this.removeVerse(refreshedId, verse.reference);
        }
      }
      this.showToast('Removed');
      if (this.selectedCategory === FAITH_SCROLL_FAVORITES_CATEGORY) {
        this.removeUnfavoritedFromFavoritesFeed();
      }
      this.pulse();
      return;
    }

    if (!this.dbUser?.id) {
      this.showToast('Log in to save');
      return;
    }

    await this.apiService.saveVerse(
      this.dbUser.id,
      verse.reference,
      verse.text,
    );
    await this.loadSavedVerses();
    this.showToast('Saved');
    this.pulse();
  }

  async loadSavedVerses(): Promise<void> {
    if (!this.dbUser?.id) {
      this.savedVerses = [];
      this.favoriteRefs = new Set<string>();
      this.savedVerseIdByRef.clear();
      return;
    }

    const result = await this.apiService.getSavedVerses(this.dbUser.id);
    const rawVerses =
      result?.verses ||
      result?.savedVerses ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    this.savedVerses = (Array.isArray(rawVerses) ? rawVerses : []).map(
      (verse: any) => ({
        id: verse.id,
        verseRef: verse.verseRef || verse.verse_ref || verse.reference || '',
        verseText: verse.verseText || verse.verse_text || verse.text || '',
      }),
    );

    this.favoriteRefs = new Set(
      this.savedVerses.map((verse) => verse.verseRef).filter(Boolean),
    );
    this.savedVerseIdByRef = new Map(
      this.savedVerses
        .filter((verse) => !!verse.verseRef && !!verse.id)
        .map((verse) => [verse.verseRef, verse.id] as const),
    );
  }

  async removeVerse(id: number, verseRef?: string): Promise<void> {
    await this.apiService.deleteSavedVerse(id);
    if (verseRef) {
      this.savedVerseIdByRef.delete(verseRef);
    }
    await this.loadSavedVerses();
  }

  async shareVerse(verse: FaithScrollVerse): Promise<void> {
    if (verse.error) return;

    const shareText = `${verse.text}\n\n${verse.reference}${verse.version ? ` (${verse.version})` : ''}\n\nbetterinchrist.com`;
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (nav.share) {
      await nav
        .share({ title: verse.reference, text: shareText })
        .catch(() => undefined);
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
      .filter(
        ({ verse, index }) =>
          !this.seenRefs.has(verse.reference) && index !== this.activeIndex,
      )
      .map(({ index }) => index);
    const candidates = unseenIndexes.length
      ? unseenIndexes
      : this.verses
          .map((_, index) => index)
          .filter((index) => index !== this.activeIndex);
    const nextIndex =
      candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
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
      loaded: false,
    };
    this.loadVerse(index);
  }

  selectCategory(categoryName: string): void {
    this.selection.select(categoryName);
    this.moreCategoriesOpen = false;
  }

  toggleMoreCategories(): void {
    this.moreCategoriesOpen = !this.moreCategoriesOpen;
  }

  shouldShowIdentityChips(): boolean {
    return this.identityChipsOpen || this.isIdentityCategory(this.selectedCategory);
  }

  isPrimaryChipActive(chip: ScrollChip): boolean {
    return this.selectedCategory === chip.categoryName;
  }

  isMoreChipActive(): boolean {
    return !this.primaryChips.some((chip) => this.isPrimaryChipActive(chip));
  }

  private buildMoreChipGroups(): ScrollChipGroup[] {
    const primaryCategoryNames = new Set(
      this.primaryChips.map((chip) => chip.categoryName),
    );
    const identityChildNames = new Set(
      this.identityChips.map((chip) => chip.categoryName),
    );

    return this.categoryGroups
      .map((group) => ({
        label: group.label,
        chips: group.categories
          .filter((category) => !primaryCategoryNames.has(category.name))
          .filter((category) => !identityChildNames.has(category.name))
          .map((category) => ({
            label: category.name,
            categoryName: category.name,
          })),
      }))
      .filter((group) => group.chips.length > 0);
  }

  private async loadTodayBattleChips(): Promise<void> {
    if (!this.dbUser?.id) {
      this.setPrimaryChips([]);
      return;
    }

    try {
      const result = await firstValueFrom(
        this.userBattlesService.getTodayBattles(this.dbUser.id),
      );
      this.setPrimaryChips(this.normalizeBattles(result));
    } catch (error) {
      console.error('Load Faith Scroll battle chips failed:', error);
      this.setPrimaryChips([]);
    }
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
    const refs = category.preserveOrder
      ? this.getCategoryRefs(category)
      : this.shuffleRefs(this.getCategoryRefs(category));

    this.selectedCategory = category.name;
    this.identityChipsOpen = this.isIdentityCategory(category.name);
    this.loading = true;
    this.emptyMessage = '';
    this.inFlightRefs.clear();
    this.seenRefs.clear();
    this.verses = refs.map((ref) => ({
      reference: ref,
      text: category.textByRef?.[ref] || 'Loading Scripture...',
      version: '',
      loaded: !!category.textByRef?.[ref],
      error: false,
      sectionTitle: category.sectionTitleByRef?.[ref],
      staticText: !!category.textByRef?.[ref],
    }));
    this.activeIndex = 0;

    if (!this.verses.length) {
      this.emptyMessage =
        category.name === FAITH_SCROLL_FAVORITES_CATEGORY
          ? 'Heart verses to build your Favorites scroll.'
          : 'No verses found for this selection.';
      this.loading = false;
      return;
    }

    if (this.verses.every((verse) => verse.loaded)) {
      this.loading = false;
    }

    setTimeout(() => {
      this.scrollToIndex(0, 'auto', token);
      this.loadVerseWindow(this.activeIndex, token);
    });
  }

  private findCategory(categoryName: string): FaithScrollCategory {
    return (
      this.categories.find((category) => category.name === categoryName) ||
      this.categories[0]
    );
  }

  private getInitialScrollCategory(): string {
    return this.normalizeScrollCategory(
      this.route.snapshot.queryParamMap.get('scroll'),
    ) || 'Faith';
  }

  private normalizeScrollCategory(categoryName: string | null): string | null {
    if (!categoryName) return null;

    const aliases: Record<string, string> = {
      Doubt: 'Spiritual Doubt',
      Tired: 'Work Burnout',
      Shame: 'Shame & Guilt',
      Accepted: WHO_I_AM_ACCEPTED_CATEGORY,
      Secure: WHO_I_AM_SECURE_CATEGORY,
      Significant: WHO_I_AM_SIGNIFICANT_CATEGORY,
    };
    const requestedName = aliases[categoryName] || categoryName;
    return this.categories.some((category) => category.name === requestedName)
      ? requestedName
      : null;
  }

  private buildCategoryGroups(): FaithScrollCategoryGroup[] {
    const emotionCategories: FaithScrollCategory[] = EMOTIONS.map(
      (emotion) => ({
        name: emotion.emotion,
        refs: emotion.keywordVerses,
      }),
    );
    const growthCategories: FaithScrollCategory[] = GROWTH_TRAITS.map(
      (trait) => ({
        name: trait.emotion,
        refs: trait.keywordVerses,
      }),
    );
    const featuredCategories: FaithScrollCategory[] = [
      {
        name: FAITH_SCROLL_FAVORITES_CATEGORY,
        refs: [],
      },
      JESUS_WORDS_CATEGORY,
      {
        name: 'Prayer',
        refs: [
          'Matthew 6:6',
          'Matthew 6:9-13',
          'Philippians 4:6-7',
          '1 Thessalonians 5:16-18',
          'James 5:16',
          'Hebrews 4:16',
          'Psalm 145:18',
          'Jeremiah 33:3',
          'Romans 8:26',
          '1 John 5:14-15',
        ],
      },
      {
        name: 'Wisdom',
        refs: [
          'James 1:5',
          'Proverbs 3:5-6',
          'Proverbs 9:10',
          'Proverbs 16:9',
          'Psalm 119:105',
          'Colossians 3:16',
          'Ephesians 5:15-17',
          'Proverbs 11:14',
          'Psalm 25:4-5',
          'Isaiah 30:21',
        ],
      },
      {
        name: 'All Scripture',
        refs: [
          ...JESUS_WORDS_CATEGORY.refs,
          ...FAITH_SCROLL_CATEGORIES.flatMap((category) => category.refs),
          ...emotionCategories.flatMap((category) => category.refs),
          ...growthCategories.flatMap((category) => category.refs),
        ],
      },
      ...FAITH_SCROLL_CATEGORIES,
    ];

    return [
      { label: 'Featured', categories: featuredCategories },
      { label: 'Identity', categories: WHO_I_AM_CATEGORIES },
      { label: 'Emotions', categories: emotionCategories },
      { label: 'Growth', categories: growthCategories },
    ];
  }

  private getCategoryRefs(category: FaithScrollCategory): string[] {
    if (category.name === FAITH_SCROLL_FAVORITES_CATEGORY) {
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
    if (!verse || verse.loaded || this.inFlightRefs.has(verse.reference))
      return;

    const requestedRef = verse.reference;
    const sectionTitle = verse.sectionTitle;
    const staticText = verse.staticText;
    this.inFlightRefs.add(requestedRef);

    this.bibleService
      .getPassage(requestedRef)
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
            error: false,
            sectionTitle,
            staticText,
          };
        }),
        catchError(() =>
          of({
            reference: requestedRef,
            text: 'This verse did not load.',
            version: '',
            loaded: true,
            error: true,
            sectionTitle,
            staticText,
          }),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((loadedVerse) => {
        this.inFlightRefs.delete(requestedRef);
        if (
          token !== this.loadToken ||
          this.verses[index]?.reference !== requestedRef
        )
          return;

        this.verses[index] = loadedVerse;
        if (index === this.activeIndex) {
          this.loading = false;
        }
      });
  }

  private scrollToIndex(
    index: number,
    behavior: ScrollBehavior = 'smooth',
    token = this.loadToken,
  ): void {
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
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    return shuffled;
  }

  private isIdentityCategory(categoryName: string): boolean {
    return (
      categoryName === WHO_I_AM_IN_CHRIST_CATEGORY ||
      this.identityChips.some((chip) => chip.categoryName === categoryName)
    );
  }

  private setPrimaryChips(battles: string[]): void {
    const chips = battles.length ? battles : ['Anxiety', 'Shame'];
    this.primaryChips = chips.slice(0, 5).map((battle) => ({
      label: battle,
      categoryName: this.getBattleCategoryName(battle),
    }));
    this.moreChipGroups = this.buildMoreChipGroups();
  }

  private getBattleCategoryName(battle: string): string {
    const aliases: Record<string, string> = {
      Shame: 'Shame & Guilt',
      Doubt: 'Spiritual Doubt',
      Tired: 'Work Burnout',
    };
    return aliases[battle] || battle;
  }

  private normalizeBattles(result: any): string[] {
    const rawBattles =
      result?.battles ||
      result?.data?.battles ||
      result?.userBattles ||
      result?.todayBattles ||
      (Array.isArray(result) ? result : []);

    return (Array.isArray(rawBattles) ? rawBattles : [])
      .filter((battle) => typeof battle === 'string')
      .map((battle) => battle.trim())
      .filter(Boolean);
  }

  private markSeen(index: number): void {
    const verse = this.verses[index];
    if (verse) this.seenRefs.add(verse.reference);
  }

  private removeUnfavoritedFromFavoritesFeed(): void {
    const currentRef = this.verses[this.activeIndex]?.reference;
    this.verses = this.verses.filter((verse) =>
      this.favoriteRefs.has(verse.reference),
    );
    this.emptyMessage = this.verses.length
      ? ''
      : 'Heart verses to build your Favorites scroll.';
    if (!this.verses.length) {
      this.activeIndex = 0;
      return;
    }

    const currentIndex = currentRef
      ? this.verses.findIndex((verse) => verse.reference === currentRef)
      : -1;
    this.activeIndex = Math.max(0, currentIndex);
    setTimeout(() => this.scrollToIndex(this.activeIndex, 'auto'));
  }

  private async bootstrapUserAndFavorites(): Promise<void> {
    await this.clerkService.load();
    this.user = this.clerkService.user;

    if (!this.user) {
      this.dbUser = null;
      this.setPrimaryChips([]);
      await this.loadSavedVerses();
      if (this.selectedCategory === FAITH_SCROLL_FAVORITES_CATEGORY) {
        this.loadCategory(this.selectedCategory);
      }
      return;
    }

    const result = await this.apiService.createOrGetUser(this.user);
    this.dbUser = result.user;
    await Promise.allSettled([
      this.loadSavedVerses(),
      this.loadTodayBattleChips(),
    ]);

    if (this.selectedCategory === FAITH_SCROLL_FAVORITES_CATEGORY) {
      this.loadCategory(this.selectedCategory);
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
