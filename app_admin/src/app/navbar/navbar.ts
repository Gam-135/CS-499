import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Authentication } from '../services/authentication';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  constructor(
    private authentication: Authentication,
    private router: Router
  ) {}

  isLoggedIn(): boolean {
    return this.authentication.isLoggedIn();
  }

  onLogout(): void {
    this.authentication.logout();
    this.router.navigate(['/login']);
  }
}