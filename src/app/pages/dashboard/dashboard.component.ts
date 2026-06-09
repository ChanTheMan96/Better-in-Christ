import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClerkService } from 'src/app/services/clerk.service';
import { ApiService } from 'src/app/services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  displayName = '';
  user: any = null;
  dbUser: any = null;
  savedVerses: any[] = [];

  verseRef = 'John 3:16';
  verseText = 'For God so loved the world...';
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
}
