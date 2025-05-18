import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class FetchService {
  urlBase = 'http://localhost/back/';
  private token?: string;

  loggedUser(): boolean {
    return !!this.token;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    if (this.token) {
      return {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      };
    } else {
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async post<T = any>(url: string, body: string): Promise<T> {
    try {
      const response = await fetch(`${this.urlBase}${url}`, {
        method: 'POST',
        body: body,
        headers: this.getHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        throw new Error(data);
      }
    } catch (error) {
      throw error;
    }
  }

  async get<T = any>(url: string): Promise<T> {
    try {
      const response = await fetch(`${this.urlBase}${url}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        throw new Error(data);
      }
    } catch (error) {
      throw error;
    }
  }
  constructor() {}
}
