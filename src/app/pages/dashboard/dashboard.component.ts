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

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, NzTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly emotions: EmotionCategory[] = EMOTIONS;
  readonly maxBattles = 5;
  readonly verseOfDay = this.getDailyVerse();
  verseOfDayText = 'Loading verse...';
  selectedBattles: string[] = [];
  quickChips: string[] = ['Anxiety', 'Shame'];
  isBattlePickerOpen = false;
  isSavingBattles = false;
  displayName = '';
  user: any = null;
  dbUser: any = null;
  savedVerses: any[] = [];
  prayerRequests: any[] = [];
  journalEntries: any[] = [];
  streak = 0;
  lastCheckinDate = '';
  isCheckingIn = false;
  modalItem: { title: string; text: string } | null = null;

  prayerTitle = '';
  prayerBody = '';
  journalTitle = '';
  journalBody = '';
  private readonly destroy$ = new Subject<void>();

  get battleQuestion(): string {
    const name = this.user?.firstName || this.displayName?.split(' ')[0] || '';
    return name
      ? `${name}, what are you battling today?`
      : 'What are you battling today?';
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
      .subscribe(() => this.loadVerseOfDay());

    await this.clerkService.load();
    this.user = this.clerkService.user;

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
        this.loadJournalEntries(),
      ]);
    }

    this.clerkService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState) => {
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

  isBattleSelected(emotion: string): boolean {
    return this.selectedBattles.includes(emotion);
  }

  removeBattle(emotion: string): void {
    this.selectedBattles = this.selectedBattles.filter(
      (battle) => battle !== emotion,
    );
  }

  isBattleDisabled(emotion: string): boolean {
    return (
      this.selectedBattles.length >= this.maxBattles &&
      !this.isBattleSelected(emotion)
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

  async checkInStreak(): Promise<void> {
    if (!this.dbUser?.id || this.isCheckingIn) {
      return;
    }

    await this.runStreakCheckIn();
  }

  async loadSavedVerses(): Promise<void> {
    if (!this.dbUser?.id) {
      this.savedVerses = [];
      return;
    }

    const result = await this.apiService.getSavedVerses(this.dbUser.id);
    const rawVerses =
      result?.verses ||
      result?.savedVerses ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    this.savedVerses = (Array.isArray(rawVerses) ? rawVerses : []).map(
      (verse: any) => this.normalizeSavedVerse(verse),
    );
  }

  async loadPrayerRequests(): Promise<void> {
    if (!this.dbUser?.id) {
      this.prayerRequests = [];
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
  }

  async loadJournalEntries(): Promise<void> {
    if (!this.dbUser?.id) {
      this.journalEntries = [];
      return;
    }

    const result = await this.apiService.getJournalEntries(this.dbUser.id);
    const rawEntries =
      result?.journal ||
      result?.journalEntries ||
      result?.entries ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    this.journalEntries = (Array.isArray(rawEntries) ? rawEntries : []).map(
      (entry: any) => this.normalizeJournalEntry(entry),
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

  async addJournalEntry(): Promise<void> {
    if (
      !this.dbUser?.id ||
      !this.journalTitle.trim() ||
      !this.journalBody.trim()
    ) {
      return;
    }

    await this.apiService.createJournalEntry(
      this.dbUser.id,
      this.journalTitle.trim(),
      this.journalBody.trim(),
    );

    this.journalTitle = '';
    this.journalBody = '';
    await this.loadJournalEntries();
  }

  async removeJournalEntry(id: number): Promise<void> {
    await this.apiService.deleteJournalEntry(id);
    await this.loadJournalEntries();
  }

  private getDailyVerse(): DailyVerse {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - start.getTime()) / 86_400_000,
    );
    return DAILY_VERSES[(dayOfYear - 1) % DAILY_VERSES.length];
  }

  private loadVerseOfDay(): void {
    this.verseOfDayText = 'Loading verse...';
    this.bibleService
      .getPassage(this.verseOfDay.ref)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe((passage) => {
        this.verseOfDayText = passage
          ? this.bibleService.formatPassageQuote(passage)
          : 'This verse did not load.';
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

      const rawLastCheckinDate =
        streakResult?.lastCheckinDate ??
        streakResult?.lastCheckInDate ??
        streakResult?.lastCheckInAt ??
        streakResult?.last_check_in_at ??
        streakResult?.data?.lastCheckinDate ??
        streakResult?.data?.lastCheckInDate ??
        streakResult?.data?.lastCheckInAt ??
        streakResult?.data?.last_check_in_at ??
        this.dbUser?.lastCheckinDate ??
        this.dbUser?.lastCheckInDate ??
        this.dbUser?.lastCheckInAt ??
        this.dbUser?.last_check_in_at;

      this.streak = Number(rawStreak) || 0;
      this.lastCheckinDate = rawLastCheckinDate
        ? new Date(rawLastCheckinDate).toLocaleDateString()
        : '';
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
      category:
        verse.category ||
        verse.verseCategory ||
        verse.verse_category ||
        verse.scrollCategory ||
        verse.scroll_category ||
        this.inferSavedVerseCategory(verseRef),
    };
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

  private normalizeJournalEntry(entry: any): any {
    return {
      id: entry.id,
      title: entry.title || '',
      body: entry.body || '',
      createdAt: entry.createdAt || entry.created_at || null,
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
