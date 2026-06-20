import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private api = 'https://better-in-christ-api.monkeycity230.workers.dev';

  private async requestJson<T = any>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.api}${path}`, init);
    return response.json() as Promise<T>;
  }

  async createOrGetUser(user: any) {
    return this.requestJson('/api/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      }),
    });
  }

  async saveVerse(
    userId: number,
    verseRef: string,
    category?: string,
    bibleVersionId?: string,
    version?: string,
  ) {
    return this.requestJson('/api/saved-verses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        verseRef,
        category,
        verseCategory: category,
        bibleVersionId,
        bibleVersion: bibleVersionId,
        version,
      }),
    });
  }

  async getSavedVerses(userId: number) {
    return this.requestJson(`/api/saved-verses?userId=${userId}`);
  }

  async deleteSavedVerse(id: number) {
    return this.requestJson(`/api/saved-verses/${id}`, {
      method: 'DELETE',
    });
  }

  async getPrayerRequests(userId: number) {
    return this.requestJson(`/api/prayer-requests?userId=${userId}`);
  }

  async createPrayerRequest(userId: number, title: string, body: string) {
    return this.requestJson('/api/prayer-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
      }),
    });
  }

  async updatePrayerRequest(
    id: number,
    title: string,
    body: string,
    isAnswered: boolean,
  ) {
    return this.requestJson(`/api/prayer-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        isAnswered,
      }),
    });
  }

  async deletePrayerRequest(id: number) {
    return this.requestJson(`/api/prayer-requests/${id}`, {
      method: 'DELETE',
    });
  }

  async checkInStreak(userId: number) {
    return this.requestJson('/api/streak/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });
  }
}
