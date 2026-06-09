import { Injectable } from '@angular/core';
import { Clerk } from '@clerk/clerk-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthState {
  isSignedIn: boolean;
  displayName: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClerkService {
  clerk = new Clerk(environment.clerkPublishableKey);
  private loadPromise?: Promise<void>;
  private initialized = false;
  private readonly authStateSubject = new BehaviorSubject<AuthState>({
    isSignedIn: false,
    displayName: ''
  });
  readonly authState$ = this.authStateSubject.asObservable();

  async load() {
    if (!this.loadPromise) {
      this.loadPromise = this.clerk.load();
    }

    await this.loadPromise;
  }

  async initialize(): Promise<void> {
    await this.load();

    if (this.initialized) {
      this.emitAuthState();
      return;
    }

    this.initialized = true;
    this.clerk.addListener(() => {
      this.emitAuthState();
    });
    this.emitAuthState();
  }

  async openSignIn() {
    await this.initialize();
    await this.clerk.redirectToSignIn({
      signInForceRedirectUrl: '/dashboard',
      signUpForceRedirectUrl: '/dashboard',
    });
  }

  async signOut() {
    await this.clerk.signOut();
    window.location.href = '/';
  }

  get authState(): AuthState {
    return this.authStateSubject.value;
  }

  get user() {
    return this.clerk.user;
  }

  private emitAuthState(): void {
    const user = this.clerk.user;
    const displayName =
      user?.firstName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      '';

    this.authStateSubject.next({
      isSignedIn: !!user,
      displayName
    });
  }
}