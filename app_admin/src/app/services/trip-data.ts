import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../models/trip';

export interface TripQueryOptions {
  search?: string;
  resort?: string;
  maxPrice?: number;
  sort?: string;
}

export interface TripListResponse {
  count: number;
  filters: {
    search: string | null;
    resort: string | null;
    maxPrice: string | null;
    sort: string;
  };
  trips: Trip[];
}

interface DeleteTripResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripData {
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

 getTrips(
  options: TripQueryOptions = {}
): Observable<TripListResponse> {
  const parameters: Record<string, string> = {};

  if (options.search?.trim()) {
    parameters['search'] = options.search.trim();
  }

  if (
    options.resort &&
    options.resort !== 'all'
  ) {
    parameters['resort'] = options.resort;
  }

  if (
    options.maxPrice !== undefined &&
    options.maxPrice !== null
  ) {
    parameters['maxPrice'] =
      options.maxPrice.toString();
  }

  if (options.sort) {
    parameters['sort'] = options.sort;
  }

  return this.http.get<TripListResponse>(
    `${this.apiBaseUrl}/trips`,
    {
      params: parameters
    }
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