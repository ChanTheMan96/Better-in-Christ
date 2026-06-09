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
    console.log('deleteSavedVerse request', { id });

    const response = await fetch(`${this.api}/api/saved-verses/${id}`, {
      method: 'DELETE',
    });

    console.log('deleteSavedVerse response', {
      id,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    });

    const result = await response.json();
    console.log('deleteSavedVerse result', result);

    return result;
  }
}
