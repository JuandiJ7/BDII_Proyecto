import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

interface ResultadoCandidato {
  nombre: string;
  votos: number;
}

interface ResultadoPlebiscito {
  pregunta: string;
  votosSi: number;
  votosNo: number;
}

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent implements OnInit {
  resultadosCandidatos: ResultadoCandidato[] = [
    { nombre: 'Candidato A', votos: 150 },
    { nombre: 'Candidato B', votos: 200 },
    { nombre: 'Candidato C', votos: 100 }
  ];

  resultadosPlebiscitos: ResultadoPlebiscito[] = [
    { pregunta: '¿Está de acuerdo con la propuesta X?', votosSi: 300, votosNo: 150 },
    { pregunta: '¿Está de acuerdo con la propuesta Y?', votosSi: 250, votosNo: 200 }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  volver(): void {
    this.router.navigate(['/inicio']);
  }
}
