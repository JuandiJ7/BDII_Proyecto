import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  username!: string;
  password!: string;
  errorMessage: string = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async login() {
    const response = await this.auth.login(this.username, this.password)
    if(response){
      await this.router.navigate(['/home']);
    } else {
      this.errorMessage = 'Las credenciales son incorrectas';
    }
    
  }
}
