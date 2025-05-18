import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginPage } from './pages/auth/login/login.page';
import { loggedGuard } from './guards/logged.guard';
import { RegistroUsuarioPage } from './pages/registro-usuario/registro-usuario.page';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full',
    },
    {
        path: 'home',
        component: HomeComponent,
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
];
