import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';

type Usuario = {
  nombre: string;
  apellido: string;
  cedula: string;
  credencial: string;
  circuito: string;
  departamento: string;
  direccion_establecimiento: string;
  rol?: string;
}

interface RolResponse {
  credencial: string;
  rol: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private fetchService: FetchService) {}

  async login(credencial: string, contraseña: string): Promise<boolean> {
    try {
      const body = JSON.stringify({ credencial, contraseña });
      const response = await this.fetchService.post<{ token: string, usuario: Usuario }>(
        'auth/',
        body
      );
      
      // Guardar token y usuario
      this.fetchService.setToken(response.token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));
      
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  }

  async getUsuarioActual(): Promise<Usuario | null> {
    try {
      // Si ya está en localStorage, lo devuelve
      const usuarioLocal = localStorage.getItem('usuario');
      console.log('Usuario en localStorage:', usuarioLocal);
      
      if (usuarioLocal && usuarioLocal !== 'undefined') {
        try {
          return JSON.parse(usuarioLocal);
        } catch (parseError) {
          console.error('Error al parsear usuario de localStorage:', parseError);
          localStorage.removeItem('usuario');
        }
      }

      // Si no está, lo busca desde el backend usando la credencial
      const token = this.fetchService.getToken();
      console.log('Token disponible:', !!token);
      
      if (!token) {
        return null;
      }

      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload del token:', tokenPayload);
        const credencial = tokenPayload.credencial;

        // Obtener datos del ciudadano
        const ciudadano = await this.fetchService.get<Usuario>(`usuarios/${credencial}`);
        console.log('Ciudadano obtenido:', ciudadano);
        
        if (ciudadano) {
          ciudadano.credencial = credencial;
          // Obtener el rol del usuario
          try {
            const rolResponse = await this.fetchService.get<{rol: string}>(`usuarios/verificar/${credencial}`);
            console.log('Rol obtenido:', rolResponse);
            
            if (rolResponse && rolResponse.rol) {
              ciudadano.rol = rolResponse.rol;
            } else {
              ciudadano.rol = 'VOTANTE';
            }
          } catch (rolError) {
            console.error('Error al obtener rol:', rolError);
            ciudadano.rol = 'VOTANTE';
          }

          // Si la cédula es igual a la credencial, es porque el backend está devolviendo la credencial
          // en lugar de la cédula. Vamos a hacer una consulta directa a la base de datos.
          if (ciudadano.cedula === credencial) {
            const ciudadanoCompleto = await this.fetchService.get<Usuario>(`usuarios/verificar?credencial=${credencial}`);
            ciudadano.cedula = ciudadanoCompleto.cedula;
          }

          localStorage.setItem('usuario', JSON.stringify(ciudadano));
          return ciudadano;
        }
      } catch (tokenError) {
        console.error('Error al procesar el token:', tokenError);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
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
