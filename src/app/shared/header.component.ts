import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { NavigationService } from '../services/navigation.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ClerkService } from '../services/clerk.service';
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
  isSignedIn = false;
  userDisplayName = '';
  selectedScrollCategory = 'Faith';
  scrollCategoryGroups: FaithScrollCategoryGroup[] = [];
  scrollPickerOpen = false;
  showInstallAction = true;
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  private readonly destroy$ = new Subject<void>();
  private readonly isIosDevice =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  constructor(
    private router: Router,
    private navSvc: NavigationService,
    private faithScrollSelection: FaithScrollSelectionService,
    private clerkService: ClerkService
  ) {}

  ngOnInit(): void {
    this.clerkService.initialize();
    this.clerkService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState) => {
        this.isSignedIn = authState.isSignedIn;
        this.userDisplayName = authState.displayName;
      });

    this.selectedScrollCategory = this.faithScrollSelection.selected;
    this.scrollCategoryGroups = this.faithScrollSelection.categoryGroups;
    this.updateRouteState(this.router.url);
    this.showInstallAction = !this.isRunningStandalone();

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
    this.showInstallAction = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.scrollPickerOpen = false;
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    this.scrollPickerOpen = false;
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

  async goToLogin(): Promise<void> {
    this.closeMobileMenu();
    await this.clerkService.openSignIn();
  }

  goToDashboard(): void {
    this.closeMobileMenu();
    this.router.navigate(['/dashboard']);
  }

  async signOut(): Promise<void> {
    this.closeMobileMenu();
    await this.clerkService.signOut();
  }

  openVersionPicker(): void {
    this.closeMobileMenu();
    this.changeVersionRequested.emit();
  }

  toggleScrollPicker(): void {
    this.scrollPickerOpen = !this.scrollPickerOpen;
  }

  onScrollCategoryChange(categoryName: string): void {
    this.scrollPickerOpen = false;
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

  private isRunningStandalone(): boolean {
    const nav = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  }
}
