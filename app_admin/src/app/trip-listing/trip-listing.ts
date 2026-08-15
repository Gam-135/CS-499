import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Trip } from '../models/trip';
import { TripCard } from '../trip-card/trip-card';
import { TripData } from '../services/trip-data';
import { Authentication } from '../services/authentication';

type SortOption =
  | 'start-ascending'
  | 'start-descending'
  | 'price-ascending'
  | 'price-descending'
  | 'length-ascending'
  | 'length-descending'
  | 'name-ascending'
  | 'name-descending';

@Component({
  selector: 'app-trip-listing',
  imports: [
    TripCard,
    RouterLink,
    FormsModule
  ],
  templateUrl: './trip-listing.html',
  styleUrl: './trip-listing.css'
})
export class TripListing implements OnInit {
  /**
   * Stores the trip records returned by the MongoDB API query.
   */
  trips = signal<Trip[]>([]);

  /**
   * Stores the complete list of resort choices collected during
   * the initial unfiltered database request.
   */
  private readonly resortOptions = signal<string[]>([]);

  searchTerm = signal('');
  selectedResort = signal('all');
  maximumPrice = signal<number | null>(null);
  sortOption = signal<SortOption>('start-ascending');

  isLoading = signal(true);
  errorMessage = signal('');

  /**
   * Exposes the saved resort choices to the template.
   */
  resorts = computed<string[]>(() =>
    this.resortOptions()
  );

  /**
   * The API already performs the search, filtering, and sorting.
   * This computed signal preserves the property used by the HTML
   * template while returning the database query results directly.
   */
  filteredTrips = computed<Trip[]>(() =>
    this.trips()
  );

  /**
   * Returns the number of records produced by the current query.
   */
  resultCount = computed<number>(() =>
    this.trips().length
  );

  /**
   * Calculates the average price of the records returned by the
   * current MongoDB query.
   */
  averagePrice = computed<number>(() => {
    const currentTrips = this.trips();

    if (currentTrips.length === 0) {
      return 0;
    }

    const totalPrice = currentTrips.reduce(
      (total, trip) =>
        total + this.toNumber(trip.perPerson),
      0
    );

    return totalPrice / currentTrips.length;
  });

  constructor(
    private readonly tripData: TripData,
    public readonly authentication: Authentication
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  /**
   * Sends the selected search, filter, and sorting values to the
   * REST API so MongoDB performs the requested database query.
   */
  loadTrips(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const sortMap: Record<SortOption, string> = {
      'start-ascending': 'startAsc',
      'start-descending': 'startDesc',
      'price-ascending': 'priceAsc',
      'price-descending': 'priceDesc',
      'length-ascending': 'lengthAsc',
      'length-descending': 'lengthDesc',
      'name-ascending': 'nameAsc',
      'name-descending': 'nameDesc'
    };

    this.tripData.getTrips({
      search: this.searchTerm(),
      resort: this.selectedResort(),
      maxPrice: this.maximumPrice() ?? undefined,
      sort: sortMap[this.sortOption()]
    }).subscribe({
      next: (response) => {
        this.trips.set(response.trips);

        /*
         * Save all resort names when the application receives an
         * unfiltered response. This prevents the resort dropdown
         * from losing choices after a filter is selected.
         */
        if (
          this.searchTerm().trim() === '' &&
          this.selectedResort() === 'all' &&
          this.maximumPrice() === null
        ) {
          this.updateResortOptions(response.trips);
        }

        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        console.error(
          'Unable to retrieve trips:',
          error
        );

        this.errorMessage.set(
          'The trip records could not be loaded.'
        );

        this.isLoading.set(false);
      }
    });
  }

  /**
   * Updates the search value and requests matching records from
   * MongoDB.
   */
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.loadTrips();
  }

  /**
   * Updates the resort filter and requests matching records from
   * MongoDB.
   */
  updateSelectedResort(value: string): void {
    this.selectedResort.set(value);
    this.loadTrips();
  }

  /**
   * Updates the maximum-price filter and requests matching records
   * from MongoDB.
   */
  updateMaximumPrice(
    value: string | number | null
  ): void {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      this.maximumPrice.set(null);
      this.loadTrips();
      return;
    }

    const parsedValue = Number(value);

    if (
      !Number.isFinite(parsedValue) ||
      parsedValue < 0
    ) {
      this.maximumPrice.set(null);
      return;
    }

    this.maximumPrice.set(parsedValue);
    this.loadTrips();
  }

  /**
   * Updates the database sorting option.
   */
  updateSortOption(value: string): void {
    this.sortOption.set(value as SortOption);
    this.loadTrips();
  }

  /**
   * Restores all database query controls to their default values.
   */
  resetControls(): void {
    this.searchTerm.set('');
    this.selectedResort.set('all');
    this.maximumPrice.set(null);
    this.sortOption.set('start-ascending');
    this.loadTrips();
  }

  /**
   * Removes a deleted trip from the current result collection.
   */
  removeTrip(tripCode: string): void {
    this.trips.update((currentTrips) =>
      currentTrips.filter(
        (trip) => trip.code !== tripCode
      )
    );
  }

  /**
   * Collects unique resort names for the filter menu.
   */
  private updateResortOptions(trips: Trip[]): void {
    const uniqueResorts = new Set<string>();

    for (const trip of trips) {
      const resort = trip.resort?.trim();

      if (resort) {
        uniqueResorts.add(resort);
      }
    }

    const sortedResorts = Array.from(
      uniqueResorts
    ).sort((first, second) =>
      first.localeCompare(second)
    );

    this.resortOptions.set(sortedResorts);
  }

  /**
   * Converts stored numeric values into usable numbers.
   */
  private toNumber(
    value: string | number
  ): number {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }
}