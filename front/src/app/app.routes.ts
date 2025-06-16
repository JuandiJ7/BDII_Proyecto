import { Routes } from '@angular/router';
import { LoginPage } from './pages/auth/login/login.page';
import { loggedGuard } from './guards/logged.guard';
import { RegistroUsuarioPage } from './pages/registro-usuario/registro-usuario.page';
import { ConfirmarCircuitoComponent } from './pages/confirmar-circuito/confirmar-circuito.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { circuitoConfirmadoGuard } from './guards/circuito-confirmado.guard';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full',
    },
    {
        path: 'inicio',
        component: InicioComponent,
        canActivate: [loggedGuard],
    },
    {
        path: 'auth/login',
        component: LoginPage,
    },
    {
        path: 'registro',
        component: RegistroUsuarioPage,
    },
    {
        path: 'confirmar-circuito',
        component: ConfirmarCircuitoComponent,
    },   
    {
        path: 'votar',
        loadComponent: () =>
            import('./pages/votar/votar.component').then((m) => m.VotarComponent),
        canActivate: [loggedGuard, circuitoConfirmadoGuard]
    },
    {
        path: 'resultados',
        loadComponent: () =>
            import('./pages/resultados/resultados.component').then((m) => m.ResultadosComponent),
        canActivate: [loggedGuard]
    }
];
