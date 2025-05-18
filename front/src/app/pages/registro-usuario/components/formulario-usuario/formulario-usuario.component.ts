import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule, FormControl, ValidatorFn } from '@angular/forms';
import { UsuarioService } from '../../../../services/usuario.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formulario-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-usuario.component.html',
  styleUrls: ['./formulario-usuario.component.css']
})
export class FormularioUsuarioComponent implements OnInit {
  registroForm!: FormGroup; 
  errorBotonRegistro: string = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.registroForm = new FormGroup({
      nombre: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ]),
      apellido: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ]),
      nombre_usuario: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ], this.validarNombreUsuario.bind(this)),
      mail: new FormControl('', [
        Validators.required,
        Validators.email
      ], this.validarCorreo.bind(this)),
      password: new FormControl('', [
        Validators.required,
        this.passwordValidator()
      ]),
      repetirPassword: new FormControl('', [
        Validators.required
      ])
    }, { validators: this.passwordsIguales() });
  }

  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const isValidLength = value.length >= 8 && value.length <= 12;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

      return !passwordValid ? { passwordStrength: true } : null;
    };
  }

  passwordsIguales(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value || '';
      const repetirPassword = group.get('repetirPassword')?.value || '';
      return password === repetirPassword ? null : { noCoinciden: true };
    };
  }

  async validarNombreUsuario(control: AbstractControl): Promise<ValidationErrors | null> {
    try {
      const response = this.usuarioService.validarNombreUsuario(control.value);
      return response ? { nombreExistente: true } : null;
    } catch (error) {
      return { errorServidor: true };
    }
  }

  async validarCorreo(control: AbstractControl): Promise<ValidationErrors | null> {
    try {
      const response = this.usuarioService.validarCorreo(control.value);
      return response ? { correoExistente: true } : null;
    } catch (error) {
      return { errorServidor: true };
    }
  }


  async onSubmit() {
    if (this.registroForm?.invalid) {
      this.errorBotonRegistro = "Error. Faltan rellenar campos de manera correcta.";
      return;
    }

    const nuevoUsuario = this.registroForm?.value;
    console.log(nuevoUsuario)
    console.log("Usuario registrado")
    this.errorBotonRegistro = "Se ha registrado correctamente. Redirigiendo al login...";
  }
}

