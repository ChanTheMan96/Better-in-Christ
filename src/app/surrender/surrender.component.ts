import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, skip, takeUntil } from 'rxjs/operators';
import { BiblePassage, BibleService } from '../services/bible.service';
import { BibleVersionService } from '../services/bible-version.service';
import { TextSizeService } from '../services/text-size.service';

interface SurrenderVerseEntry {
  ref: string;
  title: string;
}

interface SurrenderDisplayVerse {
  reference: string;
  version: string;
  text: string;
}

@Component({
    selector: 'app-surrender',
    templateUrl: './surrender.component.html',
    styleUrls: ['./surrender.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SurrenderComponent implements OnInit, OnDestroy {
  verseTextSize = 16;
  loadingVerses = false;
  versePageIndex = 1;
  readonly versePageSize = 4;
  displayedVerses: SurrenderDisplayVerse[] = [];
  private allLoadedVerseResults: SurrenderDisplayVerse[] = [];
  private destroy$ = new Subject<void>();

  readonly prayerText = `Father,
I surrender everything to You.
I come covered by the blood of Jesus,
who died in my place and rose again.
Cleanse me. Claim me. Lead me.
Not my will but Your will be done.
In Jesus' name, Amen.`;

  readonly meanings: string[] = [
    'Letting go of control',
    'Trusting God with outcomes',
    'Submitting your pride',
    'Choosing obedience over emotion',
    'Giving God your anxiety, anger, and ambition'
  ];

  readonly signs: string[] = [
    "You're constantly anxious about the future",
    "You're trying to control everything",
    "You're exhausted from carrying it all",
    "You're angry because things aren't going your way",
    "You're stuck in sin but won't let God lead"
  ];

  readonly steps: string[] = [
    "Name what you're holding onto",
    'Confess it honestly to God',
    'Pray specifically',
    'Release the outcome',
    'Obey the next step God shows you'
  ];

  readonly verses: SurrenderVerseEntry[] = [
    { ref: 'Proverbs 3:5', title: 'Proverbs 3:5' },
    { ref: 'Proverbs 3:6', title: 'Proverbs 3:6' },
    { ref: 'Psalm 37:4', title: 'Psalm 37:4' },
    { ref: 'Psalm 37:5', title: 'Psalm 37:5' },
    { ref: 'Psalm 46:10', title: 'Psalm 46:10' },
    { ref: 'Psalm 55:22', title: 'Psalm 55:22' },
    { ref: 'Psalm 62:1', title: 'Psalm 62:1' },
    { ref: 'Psalm 62:5', title: 'Psalm 62:5' },
    { ref: 'Psalm 139:23', title: 'Psalm 139:23' },
    { ref: 'Isaiah 26:3', title: 'Isaiah 26:3' },
    { ref: 'Isaiah 55:8', title: 'Isaiah 55:8' },
    { ref: 'Isaiah 55:9', title: 'Isaiah 55:9' },
    { ref: 'Jeremiah 29:11', title: 'Jeremiah 29:11' },
    { ref: 'Matthew 6:33', title: 'Matthew 6:33' },
    { ref: 'Matthew 6:34', title: 'Matthew 6:34' },
    { ref: 'Matthew 16:24', title: 'Matthew 16:24' },
    { ref: 'Luke 9:23', title: 'Luke 9:23' },
    { ref: 'Luke 22:42', title: 'Luke 22:42' },
    { ref: 'John 15:5', title: 'John 15:5' },
    { ref: 'Romans 8:28', title: 'Romans 8:28' },
    { ref: 'Romans 12:1', title: 'Romans 12:1' },
    { ref: 'Romans 12:2', title: 'Romans 12:2' },
    { ref: 'Galatians 2:20', title: 'Galatians 2:20' },
    { ref: 'Philippians 4:6', title: 'Philippians 4:6' },
    { ref: 'Philippians 4:7', title: 'Philippians 4:7' },
    { ref: '1 Peter 5:6', title: '1 Peter 5:6' },
    { ref: '1 Peter 5:7', title: '1 Peter 5:7' },
    { ref: 'James 4:7', title: 'James 4:7' },
    { ref: '2 Corinthians 12:9', title: '2 Corinthians 12:9' }
  ];

  constructor(
    public bible: BibleService,
    private bibleVersions: BibleVersionService,
    private textSizeService: TextSizeService
  ) {}

  ngOnInit(): void {
    this.verseTextSize = this.textSizeService.getVerseTextSize();
    this.loadAllVerses();

    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), skip(1), takeUntil(this.destroy$))
      .subscribe(() => this.loadAllVerses());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onVerseTextSizeChange(size: number): void {
    this.verseTextSize = size;
    this.textSizeService.setVerseTextSize(size);
  }

  onVersePageChange(page: number): void {
    this.versePageIndex = page;
    this.updateVisibleVersePage();
  }

  get totalVerseCount(): number {
    return this.verses.length;
  }

  private updateVisibleVersePage(): void {
    const start = (this.versePageIndex - 1) * this.versePageSize;
    this.displayedVerses = this.allLoadedVerseResults.slice(start, start + this.versePageSize);
  }

  private loadAllVerses(): void {
    if (this.verses.length === 0) {
      this.allLoadedVerseResults = [];
      this.displayedVerses = [];
      this.loadingVerses = false;
      return;
    }

    this.loadingVerses = true;
    const calls = this.verses.map((entry) =>
      this.bible.getPassage(entry.ref).pipe(catchError(() => of(null)))
    );
    forkJoin(calls).subscribe({
      next: (results) => {
        this.allLoadedVerseResults = results.map((passage, index) => ({
          reference: passage?.reference || this.verses[index].ref,
          version: passage?.translation_name || passage?.translation_id || '',
          text: passage ? this.bible.formatPassageQuote(passage as BiblePassage) : 'Unable to load verse text.'
        }));
        this.updateVisibleVersePage();
        this.loadingVerses = false;
      },
      error: () => {
        this.allLoadedVerseResults = this.verses.map((entry) => ({
          reference: entry.ref,
          version: '',
          text: 'Unable to load verse text.'
        }));
        this.updateVisibleVersePage();
        this.loadingVerses = false;
      }
    });
  }
}
