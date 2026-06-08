import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FaithScrollCategory } from '../data/faith-scroll.data';

export interface FaithScrollCategoryGroup {
  label: string;
  categories: FaithScrollCategory[];
}

export const FAITH_SCROLL_FAVORITES_CATEGORY = 'Favorites';

@Injectable({ providedIn: 'root' })
export class FaithScrollSelectionService {
  private readonly categoryGroups$ = new BehaviorSubject<FaithScrollCategoryGroup[]>([]);
  private readonly selectedCategory$ = new BehaviorSubject<string>('Faith');

  get categoryGroups(): FaithScrollCategoryGroup[] {
    return this.categoryGroups$.value;
  }

  get categoryGroupsChanges$() {
    return this.categoryGroups$.asObservable();
  }

  get categories(): FaithScrollCategory[] {
    return this.categoryGroups.flatMap((group) => group.categories);
  }

  get selected$() {
    return this.selectedCategory$.asObservable();
  }

  get selected(): string {
    return this.selectedCategory$.value;
  }

  setCategoryGroups(groups: FaithScrollCategoryGroup[]): void {
    this.categoryGroups$.next(groups);
  }

  select(categoryName: string): void {
    const category = this.categories.find((item) => item.name === categoryName);
    this.selectedCategory$.next(category?.name || categoryName);
  }

  resetToFaith(): void {
    this.select('Faith');
  }
}
