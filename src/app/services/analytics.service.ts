import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ClerkService } from './clerk.service';

type AnalyticsMetadata = Record<string, any>;

interface AnalyticsPayload {
  eventName: string;
  sessionId: string;
  userId: string | null;
  isLoggedIn: boolean;
  path: string;
  metadata: AnalyticsMetadata;
  viewportWidth: number | null;
  viewportHeight: number | null;
  userAgent: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly api = environment.apiBaseUrl;
  private readonly sessionStorageKey = 'bic_session_id';
  private sessionId = '';

  constructor(private clerkService: ClerkService) {}

  trackEvent(eventName: string, metadata: AnalyticsMetadata = {}): void {
    const payload = this.buildPayload(eventName, metadata);

    fetch(`${this.api}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }

  private buildPayload(
    eventName: string,
    metadata: AnalyticsMetadata,
  ): AnalyticsPayload {
    const user = this.clerkService.user;
    const isLoggedIn = !!user || this.clerkService.authState.isSignedIn;

    return {
      eventName,
      sessionId: this.getSessionId(),
      userId: user?.id || null,
      isLoggedIn,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      metadata,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : null,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  private getSessionId(): string {
    if (this.sessionId) {
      return this.sessionId;
    }

    if (typeof localStorage === 'undefined') {
      this.sessionId = this.createSessionId();
      return this.sessionId;
    }

    try {
      const existingSessionId = localStorage.getItem(this.sessionStorageKey);
      if (existingSessionId) {
        this.sessionId = existingSessionId;
        return this.sessionId;
      }

      this.sessionId = this.createSessionId();
      localStorage.setItem(this.sessionStorageKey, this.sessionId);
    } catch {
      this.sessionId = this.createSessionId();
    }

    return this.sessionId;
  }

  private createSessionId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `bic_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
