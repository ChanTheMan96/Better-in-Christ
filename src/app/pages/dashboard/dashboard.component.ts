import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClerkService } from 'src/app/services/clerk.service';
import { ApiService } from 'src/app/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, NzTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
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

  constructor(
    private clerkService: ClerkService,
    private apiService: ApiService,
  ) {}

  async ngOnInit(): Promise<void> {
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
    return {
      id: verse.id,
      verseRef: verse.verseRef || verse.verse_ref || verse.reference || '',
      verseText: verse.verseText || verse.verse_text || verse.text || '',
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
}
