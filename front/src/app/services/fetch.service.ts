import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FetchService {
  urlBase = 'http://localhost/back/';
  private token?: string;

  constructor() {
    const token = localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
  }

  loggedUser(): boolean {
    return !!this.token;
  }

  getToken(): string | undefined {
    return this.token;
  }

  setToken(token: string) {
    console.log('Token establecido:', token);
    this.token = token;
    localStorage.setItem('token', token);
  }

  private getHeaders(): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    const token = localStorage.getItem('token');
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.urlBase}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          throw new Error('401');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en GET request:', error);
      throw error;
    }
  }

  async post<T>(endpoint: string, body: string): Promise<T> {
    try {
      const response = await fetch(`${this.urlBase}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          throw new Error('401');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en POST request:', error);
      throw error;
    }
  }

  async put<T>(endpoint: string, body: string): Promise<T> {
    try {
      const response = await fetch(`${this.urlBase}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en PUT request:', error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.urlBase}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en DELETE request:', error);
      throw error;
    }
  }
}
