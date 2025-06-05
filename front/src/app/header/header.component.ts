import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FetchService } from '../services/fetch.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(public fetchService: FetchService) {}
}
