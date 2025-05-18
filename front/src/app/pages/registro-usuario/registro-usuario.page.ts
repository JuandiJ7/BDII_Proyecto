import { Component } from '@angular/core';
import { FormularioUsuarioComponent } from './components/formulario-usuario/formulario-usuario.component';

@Component({
  selector: 'app-registro-usuario',
  standalone: true,
  imports: [FormularioUsuarioComponent],
  templateUrl: './registro-usuario.page.html',
  styleUrl: './registro-usuario.page.css'
})
export class RegistroUsuarioPage {

}
