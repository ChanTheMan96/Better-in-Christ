import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { NavigationService } from '../services/navigation.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClerkService } from '../services/clerk.service';

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
  isSignedIn = false;
  isStandaloneApp = false;
  userDisplayName = '';
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  private standaloneMediaQuery?: MediaQueryList;
  private readonly destroy$ = new Subject<void>();
  private readonly isIosDevice =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  constructor(
    private router: Router,
    private navSvc: NavigationService,
    private clerkService: ClerkService
  ) {}

  ngOnInit(): void {
    this.setupStandaloneDetection();
    this.clerkService.initialize();
    this.clerkService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState) => {
        this.isSignedIn = authState.isSignedIn;
        this.userDisplayName = authState.displayName;
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
    this.isStandaloneApp = true;
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

  async goToDashboard(event?: Event): Promise<void> {
    event?.preventDefault();
    this.closeMobileMenu();
    if (this.isSignedIn) {
      await this.router.navigate(['/dashboard']);
      return;
    }

    await this.clerkService.openSignIn('/dashboard');
  }

  async signOut(): Promise<void> {
    this.closeMobileMenu();
    await this.clerkService.signOut();
  }

  openVersionPicker(): void {
    this.closeMobileMenu();
    this.changeVersionRequested.emit();
  }

  async addToHomeScreen(): Promise<void> {
    this.closeMobileMenu();

    if (this.isStandaloneApp) {
      return;
    }

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

  private setupStandaloneDetection(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    this.isStandaloneApp =
      this.standaloneMediaQuery.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    this.standaloneMediaQuery.addEventListener?.('change', (event) => {
      this.isStandaloneApp = event.matches;
    });
  }

}
