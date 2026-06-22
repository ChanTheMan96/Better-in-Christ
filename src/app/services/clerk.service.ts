import { Injectable } from '@angular/core';
import type { Clerk as ClerkType } from '@clerk/clerk-js';
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
  private _clerk?: ClerkType;
  private loadPromise?: Promise<void>;
  private initialized = false;
  private readonly authStateSubject = new BehaviorSubject<AuthState>({
    isSignedIn: false,
    displayName: ''
  });
  readonly authState$ = this.authStateSubject.asObservable();

  private async getClerk(): Promise<ClerkType> {
    if (!this._clerk) {
      const { Clerk } = await import('@clerk/clerk-js');
      this._clerk = new Clerk(environment.clerkPublishableKey);
    }
    return this._clerk;
  }

  async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const clerk = await this.getClerk();
        await clerk.load();
      })();
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
    const clerk = await this.getClerk();
    clerk.addListener(() => {
      this.emitAuthState();
    });
    this.emitAuthState();
  }

  async openSignIn(returnUrl = '/dashboard'): Promise<void> {
    await this.initialize();
    const clerk = await this.getClerk();
    await clerk.redirectToSignIn({
      signInForceRedirectUrl: returnUrl,
      signUpForceRedirectUrl: returnUrl,
    });
  }

  async openSignUp(returnUrl = '/dashboard'): Promise<void> {
    await this.initialize();
    const clerk = await this.getClerk();
    await clerk.redirectToSignUp({
      signInForceRedirectUrl: returnUrl,
      signUpForceRedirectUrl: returnUrl,
    });
  }

  async signOut(): Promise<void> {
    const clerk = await this.getClerk();
    await clerk.signOut();
    window.location.href = '/';
  }

  get authState(): AuthState {
    return this.authStateSubject.value;
  }

  get user() {
    return this._clerk?.user;
  }

  private emitAuthState(): void {
    const user = this._clerk?.user;
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
