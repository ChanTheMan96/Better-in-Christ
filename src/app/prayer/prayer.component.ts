import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BiblePassage, BibleService } from '../services/bible.service';
import { BibleVersionService } from '../services/bible-version.service';
import { TextSizeService } from '../services/text-size.service';

interface PrayerVerseEntry {
  ref: string;
  title: string;
}

interface PrayerDisplayVerse {
  reference: string;
  version: string;
  text: string;
}

@Component({
    selector: 'app-prayer',
    templateUrl: './prayer.component.html',
    styleUrls: ['./prayer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrayerComponent implements OnInit, OnDestroy {
  loadingVerses = false;
  verseTextSize = 16;
  displayedVerses: PrayerDisplayVerse[] = [];
  private destroy$ = new Subject<void>();

  readonly whatIsPrayer: string[] = [
    'Talking to God with honesty',
    'Listening for His guidance',
    'Confessing sin',
    'Asking boldly',
    'Trusting fully'
  ];

  readonly whenToPray: string[] = [
    'You feel overwhelmed',
    "You're battling temptation",
    "You're grateful",
    "You're confused",
    'You need wisdom',
    'You feel distant from God'
  ];

  readonly actsModel: string[] = [
    'A - Adoration (Praise God for who He is)',
    'C - Confession (Admit your sin honestly)',
    'T - Thanksgiving (Thank Him specifically)',
    'S - Supplication (Ask boldly for what you need)'
  ];

  readonly verseEntries: PrayerVerseEntry[] = [
    { ref: 'Philippians 4:6-7', title: 'Pray instead of worry' },
    { ref: '1 Thessalonians 5:16-18', title: 'Pray continually' },
    { ref: 'Hebrews 4:16', title: 'Approach the throne of grace' },
    { ref: 'Jeremiah 33:3', title: 'Call to Me and I will answer' },
    { ref: 'Romans 8:26', title: 'The Spirit helps in our weakness' }
  ];

  readonly lordsPrayer = `Our Father in heaven,
hallowed be Your name.
Your kingdom come,
Your will be done,
on earth as it is in heaven.
Give us today our daily bread.
Forgive us our debts,
as we also have forgiven our debtors.
And lead us not into temptation,
but deliver us from evil.
Amen.`;

  constructor(
    public bible: BibleService,
    private bibleVersions: BibleVersionService,
    private textSizeService: TextSizeService
  ) {}

  ngOnInit(): void {
    this.verseTextSize = this.textSizeService.getVerseTextSize();
    this.loadPassages();
    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.loadPassages());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onVerseTextSizeChange(size: number): void {
    this.verseTextSize = size;
    this.textSizeService.setVerseTextSize(size);
  }

  private loadPassages(): void {
    this.loadingVerses = true;
    const calls = this.verseEntries.map((entry) =>
      this.bible.getPassage(entry.ref).pipe(catchError(() => of(null)))
    );
    forkJoin(calls).subscribe({
      next: (results) => {
        this.displayedVerses = results.map((passage, index) => ({
          reference: passage?.reference || this.verseEntries[index].ref,
          version: passage?.translation_name || passage?.translation_id || '',
          text: passage ? this.bible.formatPassageQuote(passage as BiblePassage) : 'Unable to load verse text.'
        }));
        this.loadingVerses = false;
      },
      error: () => {
        this.displayedVerses = this.verseEntries.map((entry) => ({
          reference: entry.ref,
          version: '',
          text: 'Unable to load verse text.'
        }));
        this.loadingVerses = false;
      }
    });
  }
}
