import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ParentBlessingCategory } from '../../data/parent-blessings.data';
import { GuidanceVerseResult } from '../../models/guidance.model';
import { BibleVersionService } from '../../services/bible-version.service';
import { NavigationService } from '../../services/navigation.service';
import { TextSizeService } from '../../services/text-size.service';
import { ParentBlessingsService } from './parent-blessings.service';

@Component({
    selector: 'app-parent-blessings-verses',
    templateUrl: './parent-blessings-verses.component.html',
    styleUrls: ['./parent-blessings-verses.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ParentBlessingsVersesComponent implements OnInit, OnDestroy {
  category: ParentBlessingCategory | null = null;
  categorySlug = '';
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
    private readonly parentBlessings: ParentBlessingsService,
    private readonly textSizeService: TextSizeService,
    private readonly bibleVersions: BibleVersionService,
    private readonly navSvc: NavigationService
  ) {}

  ngOnInit(): void {
    this.verseTextSize = this.textSizeService.getVerseTextSize();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params.get('category') || '';
      const category = this.parentBlessings.findCategoryBySlug(slug);

      if (!category) {
        this.router.navigate(['/parent-blessings']);
        return;
      }

      this.category = category;
      this.categorySlug = slug;
      this.versePageIndex = 1;
      this.loadVerses();
      this.navSvc.setBackVisible(true);
    });

    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.category) return;
        this.parentBlessings.clearVerseCache();
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
    this.router.navigate(['/parent-blessings']);
  }

  goToDetail(event?: Event): void {
    event?.preventDefault();
    if (!this.categorySlug) return;
    this.router.navigate(['/parent-blessings', this.categorySlug]);
  }

  private loadVerses(): void {
    if (!this.category) return;
    this.loadingVerses = true;
    this.displayedVerses = [];

    this.parentBlessings
      .loadCategoryVerses(this.category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.allVerseResults = results;
          this.updateVisiblePage();
          this.loadingVerses = false;
        },
        error: () => {
          this.allVerseResults = this.category?.keywordVerses.map((reference) => ({
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

