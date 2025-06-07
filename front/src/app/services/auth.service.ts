import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private fetchService: FetchService) {}

  async login(credencial: string, contraseña: string): Promise<boolean> {
    try {
      const body = JSON.stringify({ credencial, contraseña });
      const response = await this.fetchService.post<{ token: string }>(
        'auth/',
        body
      );
      this.fetchService.setToken(response.token);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }

  async getUsuarioActual(): Promise<any> {
    // Si ya está en localStorage, lo devuelve
    const usuarioLocal = localStorage.getItem('usuario');
    if (usuarioLocal) {
      return JSON.parse(usuarioLocal);
    }

    // Si no está, lo busca desde el backend usando la credencial
    const token = this.fetchService.getToken();
    if (!token) return null;

    const credencial = JSON.parse(atob(token.split('.')[1])).credencial;

    try {
      const usuario = await this.fetchService.get<any>(`usuarios/${credencial}`);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      return usuario;
    } catch (error) {
      console.error('No se pudo obtener el usuario actual:', error);
      return null;
    }
  }


  logout(): void {
    this.fetchService.setToken('');
    localStorage.removeItem('usuario');
    localStorage.removeItem('observado');
  }

  isAuthenticated(): boolean {
    return this.fetchService.loggedUser();
  }
}
