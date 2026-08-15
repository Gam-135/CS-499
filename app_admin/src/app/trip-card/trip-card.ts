import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';
import { TripData } from '../services/trip-data';
import { Authentication } from '../services/authentication';

@Component({
  selector: 'app-trip-card',
  imports: [CommonModule],
  templateUrl: './trip-card.html',
  styleUrl: './trip-card.css'
})
export class TripCard {
  @Input() trip!: Trip;
  @Output() tripDeleted = new EventEmitter<string>();

 constructor(
  private router: Router,
  private tripData: TripData,
  public authentication: Authentication
) {}

  editTrip(trip: Trip): void {
    this.router.navigate(['/edit-trip'], {
      queryParams: {
        code: trip.code
      }
    });
  }

  deleteTrip(trip: Trip): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${trip.name}?`
    );

    if (!confirmed) {
      return;
    }

    this.tripData.deleteTrip(trip.code).subscribe({
      next: () => {
        this.tripDeleted.emit(trip.code);
      },
      error: (error: unknown) => {
        console.error('Unable to delete trip:', error);
      }
    });
  }
}