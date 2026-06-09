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

  verseRef = 'John 3:16';
  verseText = 'For God so loved the world...';
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
      console.log('D1 user:', this.dbUser);

      await this.loadSavedVerses();
      await this.loadPrayerRequests();
      await this.loadJournalEntries();
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
      (verse: any) => ({
        id: verse.id,
        verseRef: verse.verseRef || verse.verse_ref || verse.reference || '',
        verseText: verse.verseText || verse.verse_text || verse.text || '',
      }),
    );
  }

  async loadPrayerRequests(): Promise<void> {
    if (!this.dbUser?.id) {
      this.prayerRequests = [];
      return;
    }

    const result = await this.apiService.getPrayerRequests(this.dbUser.id);
    const rawRequests =
      result?.prayerRequests ||
      result?.requests ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    this.prayerRequests = Array.isArray(rawRequests) ? rawRequests : [];
  }

  async loadJournalEntries(): Promise<void> {
    if (!this.dbUser?.id) {
      this.journalEntries = [];
      return;
    }

    const result = await this.apiService.getJournalEntries(this.dbUser.id);
    const rawEntries =
      result?.journalEntries ||
      result?.entries ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    this.journalEntries = Array.isArray(rawEntries) ? rawEntries : [];
  }

  async saveVerse(): Promise<void> {
    if (!this.dbUser?.id) {
      return;
    }

    await this.apiService.saveVerse(
      this.dbUser.id,
      this.verseRef,
      this.verseText,
    );

    await this.loadSavedVerses();
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
}
