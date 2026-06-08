import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ParentBlessingCategory } from '../../data/parent-blessings.data';
import { NavigationService } from '../../services/navigation.service';
import { ParentBlessingsService } from './parent-blessings.service';

@Component({
  selector: 'app-parent-blessings-selection',
  templateUrl: './parent-blessings-selection.component.html',
  styleUrls: ['./parent-blessings-selection.component.scss']
})
export class ParentBlessingsSelectionComponent {
  readonly categories: ParentBlessingCategory[] = this.parentBlessings.getCategories();

  constructor(
    private readonly parentBlessings: ParentBlessingsService,
    private readonly router: Router,
    private readonly navSvc: NavigationService
  ) {
    this.navSvc.setBackVisible(false);
  }

  openCategory(category: ParentBlessingCategory): void {
    const slug = this.parentBlessings.toSlug(category.emotion);
    this.navSvc.setBackVisible(true);
    this.router.navigate(['/parent-blessings', slug]);
  }
}

