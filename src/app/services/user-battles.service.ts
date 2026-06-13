import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const API_URL = 'https://better-in-christ-api.monkeycity230.workers.dev';

@Injectable({
  providedIn: 'root',
})
export class UserBattlesService {
  constructor(private http: HttpClient) {}

  getTodayBattles(userId: number) {
    return this.http.get<any>(
      `${API_URL}/api/user-battles/today?userId=${userId}`,
    );
  }

  saveTodayBattles(userId: number, battles: string[]) {
    return this.http.post<any>(`${API_URL}/api/user-battles/today`, {
      userId,
      battles,
    });
  }

  clearTodayBattles(userId: number) {
    return this.http.delete<any>(
      `${API_URL}/api/user-battles/today?userId=${userId}`,
    );
  }
}
