import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { GuidanceCategory, GuidanceVerseResult } from '../../models/guidance.model';
import { BibleVersionService } from '../../services/bible-version.service';
import { NavigationService } from '../../services/navigation.service';
import { TextSizeService } from '../../services/text-size.service';
import { GrowthService } from './growth.service';

@Component({
    selector: 'app-growth-verses',
    templateUrl: './growth-verses.component.html',
    styleUrls: ['./growth-verses.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GrowthVersesComponent implements OnInit, OnDestroy {
  trait: GuidanceCategory | null = null;
  traitSlug = '';
  loadingVerses = false;
  verseTextSize = 16;
  versePageIndex = 1;
  readonly versePageSize = 4;
  displayedVerses: GuidanceVerseResult[] = [];

  private readonly destroy$ = new Subject<void>();
  private allVerseResults: GuidanceVerseResult[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly growthService: GrowthService,
    private readonly textSizeService: TextSizeService,
    private readonly bibleVersions: BibleVersionService,
    private readonly navSvc: NavigationService
  ) {}

  ngOnInit(): void {
    this.verseTextSize = this.textSizeService.getVerseTextSize();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params.get('trait') || '';
      const trait = this.growthService.findTraitBySlug(slug);

      if (!trait) {
        this.router.navigate(['/growth']);
        return;
      }

      this.trait = trait;
      this.traitSlug = slug;
      this.versePageIndex = 1;
      this.loadVerses();
      this.navSvc.setBackVisible(true);
    });

    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.trait) return;
        this.growthService.clearVerseCache();
        this.versePageIndex = 1;
        this.loadVerses();
      });
  }

  get totalVerseCount(): number {
    return this.allVerseResults.length;
  }

  onVerseTextSizeChange(size: number): void {
    this.verseTextSize = size;
    this.textSizeService.setVerseTextSize(size);
  }

  onVersePageChange(page: number): void {
    this.versePageIndex = page;
    this.updateVisiblePage();
  }

  goToList(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['/growth']);
  }

  goToDetail(event?: Event): void {
    event?.preventDefault();
    if (!this.traitSlug) return;
    this.router.navigate(['/growth', this.traitSlug]);
  }

  private loadVerses(): void {
    if (!this.trait) return;
    this.loadingVerses = true;
    this.displayedVerses = [];

    this.growthService
      .loadTraitVerses(this.trait)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.allVerseResults = results;
          this.updateVisiblePage();
          this.loadingVerses = false;
        },
        error: () => {
          this.allVerseResults = this.trait?.keywordVerses.map((reference) => ({
            reference,
            version: '',
            text: 'Unable to load verse text.'
          })) || [];
          this.updateVisiblePage();
          this.loadingVerses = false;
        }
      });
  }

  private updateVisiblePage(): void {
    const start = (this.versePageIndex - 1) * this.versePageSize;
    this.displayedVerses = this.allVerseResults.slice(start, start + this.versePageSize);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

