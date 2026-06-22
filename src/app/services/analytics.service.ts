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
  pageViewCount?: number;
  page_view_count?: number;
  pages_json?: string;
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
  private readonly pageViewCountStorageKey = 'bic_page_view_count';
  private readonly pagesJsonStorageKey = 'bic_pages_json';
  private sessionId = '';

  constructor(private clerkService: ClerkService) {}

  trackEvent(eventName: string, metadata: AnalyticsMetadata = {}): void {
    const payload = this.buildPayload(eventName, metadata);
    this.sendPayload(payload);
  }

  trackPageView(path: string): void {
    const pageView = this.recordPageView(path);
    const payload = this.buildPayload('page_viewed', {
      source: 'router',
    });

    this.sendPayload({
      ...payload,
      path,
      pageViewCount: pageView.count,
      page_view_count: pageView.count,
      pages_json: pageView.pagesJson,
    });
  }

  private sendPayload(payload: AnalyticsPayload): void {
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

  private recordPageView(path: string): { count: number; pagesJson: string } {
    if (typeof localStorage === 'undefined') {
      return { count: 1, pagesJson: JSON.stringify([path]) };
    }

    try {
      const currentCount = Number(
        localStorage.getItem(this.pageViewCountStorageKey),
      ) || 0;
      const nextCount = currentCount + 1;
      const pages = this.getPagesHistory();
      pages.push(path);
      localStorage.setItem(this.pageViewCountStorageKey, String(nextCount));
      localStorage.setItem(this.pagesJsonStorageKey, JSON.stringify(pages));
      return { count: nextCount, pagesJson: JSON.stringify(pages) };
    } catch {
      return { count: 1, pagesJson: JSON.stringify([path]) };
    }
  }

  private getPagesHistory(): string[] {
    try {
      const pages = JSON.parse(
        localStorage.getItem(this.pagesJsonStorageKey) || '[]',
      );
      return Array.isArray(pages)
        ? pages.filter((page) => typeof page === 'string')
        : [];
    } catch {
      return [];
    }
  }
}
