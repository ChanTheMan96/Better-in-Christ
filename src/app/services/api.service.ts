import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private api = 'https://better-in-christ-api.monkeycity230.workers.dev';

  async createOrGetUser(user: any) {
    const response = await fetch(`${this.api}/api/me`, {
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

    return response.json();
  }

  async saveVerse(userId: number, verseRef: string, verseText: string) {
    const response = await fetch(`${this.api}/api/saved-verses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        verseRef,
        verseText,
      }),
    });

    return response.json();
  }

  async getSavedVerses(userId: number) {
    const response = await fetch(
      `${this.api}/api/saved-verses?userId=${userId}`,
    );

    return response.json();
  }

  async deleteSavedVerse(id: number) {
    const response = await fetch(`${this.api}/api/saved-verses/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    return result;
  }

  async getPrayerRequests(userId: number) {
    const response = await fetch(
      `${this.api}/api/prayer-requests?userId=${userId}`,
    );

    return response.json();
  }

  async createPrayerRequest(userId: number, title: string, body: string) {
    const response = await fetch(`${this.api}/api/prayer-requests`, {
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

    return response.json();
  }

  async updatePrayerRequest(
    id: number,
    title: string,
    body: string,
    isAnswered: boolean,
  ) {
    const response = await fetch(`${this.api}/api/prayer-requests/${id}`, {
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

    return response.json();
  }

  async deletePrayerRequest(id: number) {
    const response = await fetch(`${this.api}/api/prayer-requests/${id}`, {
      method: 'DELETE',
    });

    return response.json();
  }

  async getJournalEntries(userId: number) {
    const response = await fetch(`${this.api}/api/journal?userId=${userId}`);

    return response.json();
  }

  async createJournalEntry(userId: number, title: string, body: string) {
    const response = await fetch(`${this.api}/api/journal`, {
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

    return response.json();
  }

  async updateJournalEntry(id: number, title: string, body: string) {
    const response = await fetch(`${this.api}/api/journal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
      }),
    });

    return response.json();
  }

  async deleteJournalEntry(id: number) {
    const response = await fetch(`${this.api}/api/journal/${id}`, {
      method: 'DELETE',
    });

    return response.json();
  }

  async getStreak(userId: number) {
    const response = await fetch(`${this.api}/api/streak?userId=${userId}`);

    return response.json();
  }

  async checkInStreak(userId: number) {
    const response = await fetch(`${this.api}/api/streak/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    return response.json();
  }
}
