import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { GuidanceCategory } from '../../models/guidance.model';
import { GrowthService } from './growth.service';

@Component({
    selector: 'app-growth-selection',
    templateUrl: './growth-selection.component.html',
    styleUrls: ['./growth-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GrowthSelectionComponent {
  readonly traits: GuidanceCategory[] = this.growthService.getTraits();

  constructor(
    private readonly growthService: GrowthService,
    private readonly router: Router,
    private readonly navSvc: NavigationService
  ) {
    this.navSvc.setBackVisible(false);
  }

  openTrait(trait: GuidanceCategory): void {
    const slug = this.growthService.toSlug(trait.emotion);
    this.navSvc.setBackVisible(true);
    this.router.navigate(['/growth', slug]);
  }
}

