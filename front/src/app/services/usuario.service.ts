import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  constructor(private fetchService: FetchService) {}

  validarNombreUsuario(nombreUsuario: string): boolean {
    return false;
  }

  validarCorreo(mail: string): boolean {
    return false;
  }

  registrarUsuario(usuario: any): Promise<any> {
    return this.fetchService.post('usuarios', JSON.stringify(usuario));
  }
}