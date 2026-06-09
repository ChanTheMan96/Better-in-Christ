import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParentBlessingCategory } from '../../data/parent-blessings.data';
import { NavigationService } from '../../services/navigation.service';
import { ParentBlessingsService } from './parent-blessings.service';

@Component({
    selector: 'app-parent-blessings-detail',
    templateUrl: './parent-blessings-detail.component.html',
    styleUrls: ['./parent-blessings-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ParentBlessingsDetailComponent implements OnInit, OnDestroy {
  category: ParentBlessingCategory | null = null;
  categorySlug = '';
  guidanceText = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly parentBlessings: ParentBlessingsService,
    private readonly navSvc: NavigationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params.get('category') || '';
      const category = this.parentBlessings.findCategoryBySlug(slug);

      if (!category) {
        this.router.navigate(['/parent-blessings']);
        return;
      }

      this.category = category;
      this.categorySlug = slug;
      this.guidanceText = this.parentBlessings.getGuidance(category);
      this.navSvc.setBackVisible(true);
    });
  }

  goToList(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['/parent-blessings']);
  }

  openVerses(): void {
    if (!this.categorySlug) return;
    this.router.navigate(['/parent-blessings', this.categorySlug, 'verses']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

