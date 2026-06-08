import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MensHelp } from '../../models/mens-help.model';
import { NavigationService } from '../../services/navigation.service';
import { GrowthService } from './growth.service';

@Component({
  selector: 'app-growth-detail',
  templateUrl: './growth-detail.component.html',
  styleUrls: ['./growth-detail.component.scss']
})
export class GrowthDetailComponent implements OnInit, OnDestroy {
  trait: MensHelp | null = null;
  traitSlug = '';
  guidanceText = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly growthService: GrowthService,
    private readonly navSvc: NavigationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params.get('trait') || '';
      const trait = this.growthService.findTraitBySlug(slug);

      if (!trait) {
        this.router.navigate(['/growth']);
        return;
      }

      this.trait = trait;
      this.traitSlug = slug;
      this.guidanceText = this.growthService.getGuidance(trait);
      this.navSvc.setBackVisible(true);
    });
  }

  goToList(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['/growth']);
  }

  openVerses(): void {
    if (!this.traitSlug) return;
    this.router.navigate(['/growth', this.traitSlug, 'verses']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

