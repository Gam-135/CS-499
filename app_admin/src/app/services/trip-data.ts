import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../models/trip';

interface DeleteTripResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripData {
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(
      `${this.apiBaseUrl}/trips`
    );
  }

  getTrip(tripCode: string): Observable<Trip> {
    return this.http.get<Trip>(
      `${this.apiBaseUrl}/trips/${tripCode}`
    );
  }

  addTrip(trip: Trip): Observable<Trip> {
    return this.http.post<Trip>(
      `${this.apiBaseUrl}/trips`,
      trip
    );
  }

  updateTrip(
    originalTripCode: string,
    trip: Trip
  ): Observable<Trip> {
    return this.http.put<Trip>(
      `${this.apiBaseUrl}/trips/${originalTripCode}`,
      trip
    );
  }

  deleteTrip(
    tripCode: string
  ): Observable<DeleteTripResponse> {
    return this.http.delete<DeleteTripResponse>(
      `${this.apiBaseUrl}/trips/${tripCode}`
    );
  }
}