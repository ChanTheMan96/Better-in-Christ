import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { NavigationService } from '../services/navigation.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  FaithScrollCategoryGroup,
  FaithScrollSelectionService
} from '../services/faith-scroll-selection.service';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() changeVersionRequested = new EventEmitter<void>();
  mobileMenuOpen = false;
  isFaithScrollRoute = false;
  selectedScrollCategory = 'Faith';
  scrollCategoryGroups: FaithScrollCategoryGroup[] = [];
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly isIosDevice =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  constructor(
    private router: Router,
    private navSvc: NavigationService,
    private faithScrollSelection: FaithScrollSelectionService
  ) {}

  ngOnInit(): void {
    this.selectedScrollCategory = this.faithScrollSelection.selected;
    this.scrollCategoryGroups = this.faithScrollSelection.categoryGroups;
    this.updateRouteState(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.updateRouteState(event.urlAfterRedirects));

    this.faithScrollSelection.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((categoryName) => {
        this.selectedScrollCategory = categoryName;
      });

    this.faithScrollSelection.categoryGroupsChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe((groups) => {
        this.scrollCategoryGroups = groups;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
  }

  @HostListener('window:appinstalled')
  onAppInstalled(): void {
    this.deferredInstallPrompt = null;
  }

  goHome(event: MouseEvent): void {
    event.preventDefault();
    this.closeMobileMenu();
    this.navSvc.setBackVisible(false);
    this.navSvc.resetView();
    this.router.navigate(['/']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  openVersionPicker(): void {
    this.closeMobileMenu();
    this.changeVersionRequested.emit();
  }

  onScrollCategoryChange(categoryName: string): void {
    this.faithScrollSelection.select(categoryName);
  }

  async addToHomeScreen(): Promise<void> {
    this.closeMobileMenu();

    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      await this.deferredInstallPrompt.userChoice.catch(() => undefined);
      this.deferredInstallPrompt = null;
      return;
    }

    if (this.isIosDevice) {
      alert('On iPhone/iPad: tap Share, then tap "Add to Home Screen".');
      return;
    }

    alert('Use your browser menu and select "Install app" or "Add to Home screen".');
  }

  private updateRouteState(url: string): void {
    this.isFaithScrollRoute = url.split('?')[0].split('#')[0] === '/faith-scroll';
  }
}
