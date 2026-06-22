import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClerkService } from 'src/app/services/clerk.service';
import { ApiService } from 'src/app/services/api.service';
import { firstValueFrom, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DAILY_VERSES, DailyVerse } from 'src/app/data/daily-verse.data';
import { BibleService } from 'src/app/services/bible.service';
import { BibleVersionService } from 'src/app/services/bible-version.service';
import { EMOTIONS, EmotionCategory } from 'src/app/data/emotions.data';
import { UserBattlesService } from 'src/app/services/user-battles.service';
import {
  FAITH_SCROLL_CATEGORIES,
  JESUS_WORDS_CATEGORY,
  WHO_I_AM_CATEGORIES,
} from 'src/app/data/faith-scroll.data';
import { GROWTH_TRAITS } from 'src/app/data/growth.data';
import { BattlePickerComponent } from './battle-picker.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, NzTabsModule, BattlePickerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly emotions: EmotionCategory[] = EMOTIONS;
  readonly maxBattles = 5;
  readonly verseOfDay = this.getDailyVerse();
  readonly prayerKeyFacts = [
    'Prayer is honest relationship with God, not performance.',
    'Pray when you feel overwhelmed, tempted, grateful, confused, or distant.',
    'Use ACTS: Adoration, Confession, Thanksgiving, Supplication.',
    'Come boldly to the throne of grace through Jesus.',
  ];
  readonly surrenderKeyFacts = [
    'Surrender is not quitting; it is trusting God with control and outcomes.',
    'Name what you are holding onto, confess it honestly, and release the outcome.',
    'Choose obedience over emotion when God shows the next step.',
    'Real strength begins where self-rule ends.',
  ];
  verseOfDayText = 'Loading verse...';
  verseOfDayVersion = '';
  selectedBattles: string[] = [];
  quickChips: string[] = ['Anxiety', 'Shame'];
  isBattlePickerOpen = false;
  isSavingBattles = false;
  displayName = '';
  user: any = null;
  dbUser: any = null;
  savedVerses: any[] = [];
  savedTruthsPage = 1;
  readonly savedTruthsPageSize = 5;
  prayerRequests: any[] = [];
  prayerRequestsPage = 1;
  readonly prayerRequestsPageSize = 5;
  streak = 0;
  isCheckingIn = false;
  modalItem: { title: string; text: string } | null = null;

  prayerTitle = '';
  prayerBody = '';
  private readonly destroy$ = new Subject<void>();
  private savedVersesLoadToken = 0;
  private isRedirectingToAuth = false;

  get battleQuestion(): string {
    const name = this.user?.firstName || this.displayName?.split(' ')[0] || '';
    return name
      ? `${name}, what are you battling today?`
      : 'What are you battling today?';
  }

  get savedTruthsTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.savedVerses.length / this.savedTruthsPageSize),
    );
  }

  get pagedSavedVerses(): any[] {
    const start = (this.savedTruthsPage - 1) * this.savedTruthsPageSize;
    return this.savedVerses.slice(start, start + this.savedTruthsPageSize);
  }

  get shouldShowSavedTruthsPagination(): boolean {
    return this.savedVerses.length > this.savedTruthsPageSize;
  }

  get prayerRequestsTotalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.prayerRequests.length / this.prayerRequestsPageSize),
    );
  }

  get pagedPrayerRequests(): any[] {
    const start = (this.prayerRequestsPage - 1) * this.prayerRequestsPageSize;
    return this.prayerRequests.slice(
      start,
      start + this.prayerRequestsPageSize,
    );
  }

  get shouldShowPrayerRequestsPagination(): boolean {
    return this.prayerRequests.length > this.prayerRequestsPageSize;
  }

  constructor(
    private clerkService: ClerkService,
    private apiService: ApiService,
    private bibleService: BibleService,
    private bibleVersions: BibleVersionService,
    private userBattlesService: UserBattlesService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((bibleId) => {
        this.loadVerseOfDay(bibleId);
        if (this.dbUser?.id) {
          this.loadSavedVerses(bibleId);
        }
      });

    await this.clerkService.initialize();
    this.user = this.clerkService.user;

    if (!this.user) {
      await this.redirectToDashboardAuth();
      return;
    }

    if (this.user) {
      const result = await this.apiService.createOrGetUser(this.user);
      this.dbUser = result.user;
      this.displayName =
        this.dbUser?.name || this.user?.firstName || this.user?.fullName || '';

      // Streak failures should not block dashboard content.
      try {
        await this.runStreakCheckIn();
      } catch (error) {
        console.error('Streak check-in failed:', error);
      }

      await Promise.allSettled([
        this.loadTodayBattles(),
        this.loadSavedVerses(),
        this.loadPrayerRequests(),
      ]);
    }

    this.clerkService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState) => {
        if (!authState.isSignedIn) {
          this.redirectToDashboardAuth();
          return;
        }

        if (!this.displayName) {
          this.displayName = authState.displayName;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  signOut() {
    this.clerkService.signOut();
  }

  private async redirectToDashboardAuth(): Promise<void> {
    if (this.isRedirectingToAuth) {
      return;
    }

    this.isRedirectingToAuth = true;
    await this.clerkService.openSignIn('/dashboard');
  }

  openModal(title: string, text: string): void {
    this.modalItem = { title, text };
  }

  closeModal(): void {
    this.modalItem = null;
  }

  openBattlePicker(): void {
    this.isBattlePickerOpen = true;
  }

  closeBattlePicker(): void {
    this.isBattlePickerOpen = false;
  }

  toggleBattle(emotion: string): void {
    const exists = this.selectedBattles.includes(emotion);

    if (exists) {
      this.selectedBattles = this.selectedBattles.filter(
        (battle) => battle !== emotion,
      );
      return;
    }

    if (this.selectedBattles.length >= this.maxBattles) {
      return;
    }

    this.selectedBattles = [...this.selectedBattles, emotion];
  }

  removeBattle(emotion: string): void {
    this.selectedBattles = this.selectedBattles.filter(
      (battle) => battle !== emotion,
    );
  }

  async saveBattles(): Promise<void> {
    if (!this.dbUser?.id || this.isSavingBattles) {
      return;
    }

    this.isSavingBattles = true;

    try {
      await firstValueFrom(
        this.userBattlesService.saveTodayBattles(
          this.dbUser.id,
          this.selectedBattles,
        ),
      );
      this.refreshQuickChips(this.selectedBattles);
      this.closeBattlePicker();
    } catch (error) {
      console.error('Save today battles failed:', error);
    } finally {
      this.isSavingBattles = false;
    }
  }

  async loadTodayBattles(): Promise<void> {
    if (!this.dbUser?.id) {
      this.selectedBattles = [];
      this.refreshQuickChips([]);
      return;
    }

    try {
      const result = await firstValueFrom(
        this.userBattlesService.getTodayBattles(this.dbUser.id),
      );
      const battles = this.normalizeBattles(result);
      this.selectedBattles = battles.slice(0, this.maxBattles);
      this.refreshQuickChips(this.selectedBattles);
    } catch (error) {
      console.error('Load today battles failed:', error);
      this.refreshQuickChips(this.selectedBattles);
    }
  }

  async clearBattles(): Promise<void> {
    if (!this.dbUser?.id || this.isSavingBattles) {
      return;
    }

    this.isSavingBattles = true;

    try {
      await firstValueFrom(
        this.userBattlesService.clearTodayBattles(this.dbUser.id),
      );
      this.selectedBattles = [];
      this.refreshQuickChips([]);
    } catch (error) {
      console.error('Clear today battles failed:', error);
    } finally {
      this.isSavingBattles = false;
    }
  }

  getQuickChipCategory(chip: string): string {
    const aliases: Record<string, string> = {
      Shame: 'Shame & Guilt',
    };
    return aliases[chip] || chip;
  }

  getSavedVerseTitle(verse: any): string {
    return verse?.version
      ? `${verse.verseRef} ${verse.version}`
      : verse?.verseRef || '';
  }

  async loadSavedVerses(bibleId = this.bibleVersions.getSelectedVersion()): Promise<void> {
    const loadToken = ++this.savedVersesLoadToken;

    if (!this.dbUser?.id) {
      this.savedVerses = [];
      this.savedTruthsPage = 1;
      return;
    }

    const result = await this.apiService.getSavedVerses(this.dbUser.id);
    const rawVerses =
      result?.verses ||
      result?.savedVerses ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    const normalizedVerses = (Array.isArray(rawVerses) ? rawVerses : []).map(
      (verse: any) => this.normalizeSavedVerse(verse),
    );

    const hydratedVerses = await Promise.all(
      normalizedVerses.map((verse: any) => this.hydrateSavedVerse(verse, bibleId)),
    );

    if (loadToken !== this.savedVersesLoadToken) {
      return;
    }

    this.savedVerses = hydratedVerses;
    this.savedTruthsPage = Math.min(
      this.savedTruthsPage,
      this.savedTruthsTotalPages,
    );
  }

  goToSavedTruthsPage(page: number): void {
    this.savedTruthsPage = Math.max(
      1,
      Math.min(page, this.savedTruthsTotalPages),
    );
  }

  async loadPrayerRequests(): Promise<void> {
    if (!this.dbUser?.id) {
      this.prayerRequests = [];
      this.prayerRequestsPage = 1;
      return;
    }

    const result = await this.apiService.getPrayerRequests(this.dbUser.id);
    const rawRequests =
      result?.prayers ||
      result?.prayerRequests ||
      result?.requests ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    this.prayerRequests = (Array.isArray(rawRequests) ? rawRequests : []).map(
      (request: any) => this.normalizePrayerRequest(request),
    );
    this.prayerRequestsPage = Math.min(
      this.prayerRequestsPage,
      this.prayerRequestsTotalPages,
    );
  }

  goToPrayerRequestsPage(page: number): void {
    this.prayerRequestsPage = Math.max(
      1,
      Math.min(page, this.prayerRequestsTotalPages),
    );
  }

  async removeVerse(id: number) {
    await this.apiService.deleteSavedVerse(id);
    await this.loadSavedVerses();
  }

  async addPrayerRequest(): Promise<void> {
    if (
      !this.dbUser?.id ||
      !this.prayerTitle.trim() ||
      !this.prayerBody.trim()
    ) {
      return;
    }

    await this.apiService.createPrayerRequest(
      this.dbUser.id,
      this.prayerTitle.trim(),
      this.prayerBody.trim(),
    );

    this.prayerTitle = '';
    this.prayerBody = '';
    await this.loadPrayerRequests();
  }

  async togglePrayerAnswered(request: any): Promise<void> {
    await this.apiService.updatePrayerRequest(
      request.id,
      request.title,
      request.body,
      !request.isAnswered,
    );
    await this.loadPrayerRequests();
  }

  async removePrayerRequest(id: number): Promise<void> {
    await this.apiService.deletePrayerRequest(id);
    await this.loadPrayerRequests();
  }

  private getDailyVerse(): DailyVerse {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - start.getTime()) / 86_400_000,
    );
    return DAILY_VERSES[(dayOfYear - 1) % DAILY_VERSES.length];
  }

  private loadVerseOfDay(bibleId = this.bibleVersions.getSelectedVersion()): void {
    this.verseOfDayText = 'Loading verse...';
    this.verseOfDayVersion = '';
    this.bibleService
      .getPassage(this.verseOfDay.ref, bibleId)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe((passage) => {
        this.verseOfDayText = passage
          ? this.bibleService.formatPassageQuote(passage)
          : 'This verse did not load.';
        this.verseOfDayVersion = passage
          ? passage.translation_name || passage.translation_id || ''
          : '';
      });
  }

  private async runStreakCheckIn(): Promise<void> {
    if (!this.dbUser?.id || this.isCheckingIn) {
      return;
    }

    this.isCheckingIn = true;

    try {
      const streakResult = await this.apiService.checkInStreak(this.dbUser.id);

      const rawStreak =
        streakResult?.streak ??
        streakResult?.currentStreak ??
        streakResult?.current_streak ??
        streakResult?.data?.streak ??
        this.streak;

      this.streak = Number(rawStreak) || 0;
    } finally {
      this.isCheckingIn = false;
    }
  }

  private normalizeSavedVerse(verse: any): any {
    const verseRef = verse.verseRef || verse.verse_ref || verse.reference || '';
    return {
      id: verse.id,
      verseRef,
      verseText: verse.verseText || verse.verse_text || verse.text || '',
      version:
        verse.version ||
        verse.translationName ||
        verse.translation_name ||
        verse.bibleVersion ||
        verse.bible_version ||
        '',
      category:
        verse.category ||
        verse.verseCategory ||
        verse.verse_category ||
        verse.scrollCategory ||
        verse.scroll_category ||
        this.inferSavedVerseCategory(verseRef),
    };
  }

  private async hydrateSavedVerse(verse: any, bibleId: string): Promise<any> {
    if (!verse.verseRef) {
      return verse;
    }

    try {
      const passage = await firstValueFrom(
        this.bibleService.getPassage(verse.verseRef, bibleId),
      );
      const verseText = this.bibleService.formatPassageQuote(passage).trim();

      return {
        ...verse,
        verseRef: passage.reference || verse.verseRef,
        verseText: verseText || verse.verseText,
        version: passage.translation_name || passage.translation_id || verse.version,
      };
    } catch (error) {
      console.error('Saved truth hydration failed:', verse.verseRef, error);
      return verse;
    }
  }

  private normalizePrayerRequest(request: any): any {
    return {
      id: request.id,
      title: request.title || '',
      body: request.body || '',
      isAnswered:
        request.isAnswered === true ||
        request.is_answered === true ||
        request.is_answered === 1 ||
        request.is_answered === '1',
      createdAt: request.createdAt || request.created_at || null,
    };
  }

  private refreshQuickChips(battles: string[]): void {
    this.quickChips = battles.length ? [...battles] : ['Anxiety', 'Shame'];
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

  private inferSavedVerseCategory(verseRef: string): string {
    if (!verseRef) {
      return '';
    }

    const categories = [
      ...EMOTIONS.map((emotion) => ({
        name: emotion.emotion,
        refs: emotion.keywordVerses,
      })),
      ...GROWTH_TRAITS.map((trait) => ({
        name: trait.emotion,
        refs: trait.keywordVerses,
      })),
      ...WHO_I_AM_CATEGORIES,
      JESUS_WORDS_CATEGORY,
      ...FAITH_SCROLL_CATEGORIES,
    ];

    return (
      categories.find((category) => category.refs.includes(verseRef))?.name ||
      ''
    );
  }
}
