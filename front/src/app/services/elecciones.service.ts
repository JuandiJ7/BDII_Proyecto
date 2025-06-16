import { Injectable } from '@angular/core';
import { FetchService } from './fetch.service';

@Injectable({
  providedIn: 'root'
})
export class EleccionesService {
  private apiUrl = 'elecciones';

  constructor(private fetchService: FetchService) {}

  // Obtener todos los partidos
  async getPartidos(): Promise<any> {
    console.log('Llamando a getPartidos');
    return this.fetchService.get(`${this.apiUrl}/partidos`);
  }

  // Obtener listas de un partido específico
  async getListas(idPartido: number): Promise<any> {
    console.log('Llamando a getListas con idPartido:', idPartido);
    return this.fetchService.get(`${this.apiUrl}/partidos/${idPartido}/listas`);
  }

  // Obtener detalles completos de una lista
  async getDetallesLista(idLista: number): Promise<any> {
    console.log('Llamando a getDetallesLista con idLista:', idLista);
    return this.fetchService.get(`${this.apiUrl}/listas/${idLista}/detalles`);
  }

  // Obtener integrantes de una lista específica
  async getIntegrantes(idLista: number): Promise<any[]> {
    return this.fetchService.get(`${this.apiUrl}/listas/${idLista}/integrantes`);
  }

  // Obtener todas las papeletas
  async getPapeletas(): Promise<any[]> {
    console.log('Llamando a getPapeletas');
    return this.fetchService.get(`${this.apiUrl}/papeletas`);
  }

  async enviarVoto(voto: any): Promise<any> {
    console.log('Llamando a enviarVoto con datos:', voto);
    return this.fetchService.post(`${this.apiUrl}/votos`, JSON.stringify(voto));
  }
} 