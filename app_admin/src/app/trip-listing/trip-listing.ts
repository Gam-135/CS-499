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
  /*
   * The original array remains unchanged so that searches,
   * filters, and sorting operations can be reset.
   */
  trips = signal<Trip[]>([]);

  searchTerm = signal('');
  selectedResort = signal('all');
  maximumPrice = signal<number | null>(null);
  sortOption = signal<SortOption>('start-ascending');

  isLoading = signal(true);
  errorMessage = signal('');

  /**
   * Uses a Set to collect unique resort names.
   *
   * A Set is appropriate because it automatically prevents
   * duplicate resort values.
   */
  resorts = computed<string[]>(() => {
    const uniqueResorts = new Set<string>();

    for (const trip of this.trips()) {
      const resort = trip.resort?.trim();

      if (resort) {
        uniqueResorts.add(resort);
      }
    }

    return Array.from(uniqueResorts).sort((first, second) =>
      first.localeCompare(second)
    );
  });

  /**
   * Applies linear search and filtering before sorting the
   * results with the custom merge-sort implementation.
   */
  filteredTrips = computed<Trip[]>(() => {
    const normalizedSearch = this.searchTerm()
      .trim()
      .toLowerCase();

    const resortFilter = this.selectedResort();
    const priceLimit = this.maximumPrice();

    const matchingTrips = this.trips().filter((trip) => {
      const searchableValues = [
        trip.code,
        trip.name,
        trip.resort,
        trip.description
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableValues.some((value) =>
          value.includes(normalizedSearch)
        );

      const matchesResort =
        resortFilter === 'all' ||
        trip.resort === resortFilter;

      const tripPrice = this.toNumber(trip.perPerson);

      const matchesPrice =
        priceLimit === null ||
        priceLimit <= 0 ||
        tripPrice <= priceLimit;

      return (
        matchesSearch &&
        matchesResort &&
        matchesPrice
      );
    });

    return this.mergeSort(
      matchingTrips,
      this.createComparator(this.sortOption())
    );
  });

  resultCount = computed(() => this.filteredTrips().length);

  /**
   * Calculates the average price from the currently displayed
   * search results.
   */
  averagePrice = computed(() => {
    const currentTrips = this.filteredTrips();

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
   * Retrieves the complete trip collection from the API.
   */
  loadTrips(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.tripData.getTrips().subscribe({
      next: (value: Trip[]) => {
        this.trips.set(value);
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
   * Updates the search signal after the user enters text.
   */
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  /**
   * Updates the selected-resort filter.
   */
  updateSelectedResort(value: string): void {
    this.selectedResort.set(value);
  }

  /**
   * Updates the maximum-price filter.
   */
  updateMaximumPrice(value: string | number | null): void {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    this.maximumPrice.set(null);
    return;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    this.maximumPrice.set(null);
    return;
  }

  this.maximumPrice.set(parsedValue);
}

  /**
   * Updates the sorting strategy.
   */
  updateSortOption(value: string): void {
    this.sortOption.set(value as SortOption);
  }

  /**
   * Restores all algorithm controls to their defaults.
   */
  resetControls(): void {
    this.searchTerm.set('');
    this.selectedResort.set('all');
    this.maximumPrice.set(null);
    this.sortOption.set('start-ascending');
  }

  /**
   * Removes a deleted trip from the in-memory array without
   * requiring another API request.
   */
  removeTrip(tripCode: string): void {
    this.trips.update((currentTrips) =>
      currentTrips.filter(
        (trip) => trip.code !== tripCode
      )
    );
  }

  /**
   * Creates a comparison function for the selected sorting
   * strategy.
   */
  private createComparator(
    option: SortOption
  ): (first: Trip, second: Trip) => number {
    switch (option) {
      case 'start-descending':
        return (first, second) =>
          this.toDateValue(second.start) -
          this.toDateValue(first.start);

      case 'price-ascending':
        return (first, second) =>
          this.toNumber(first.perPerson) -
          this.toNumber(second.perPerson);

      case 'price-descending':
        return (first, second) =>
          this.toNumber(second.perPerson) -
          this.toNumber(first.perPerson);

      case 'length-ascending':
        return (first, second) =>
          this.toNumber(first.length) -
          this.toNumber(second.length);

      case 'length-descending':
        return (first, second) =>
          this.toNumber(second.length) -
          this.toNumber(first.length);

      case 'name-ascending':
        return (first, second) =>
          first.name.localeCompare(second.name);

      case 'name-descending':
        return (first, second) =>
          second.name.localeCompare(first.name);

      case 'start-ascending':
      default:
        return (first, second) =>
          this.toDateValue(first.start) -
          this.toDateValue(second.start);
    }
  }

  /**
   * Sorts trip records using merge sort.
   *
   * Merge sort divides the array into smaller arrays, sorts
   * those arrays recursively, and combines the results.
   *
   * Time complexity: O(n log n)
   * Additional space complexity: O(n)
   */
  private mergeSort(
    trips: Trip[],
    compare: (first: Trip, second: Trip) => number
  ): Trip[] {
    if (trips.length <= 1) {
      return [...trips];
    }

    const middleIndex = Math.floor(trips.length / 2);

    const leftHalf = this.mergeSort(
      trips.slice(0, middleIndex),
      compare
    );

    const rightHalf = this.mergeSort(
      trips.slice(middleIndex),
      compare
    );

    return this.merge(
      leftHalf,
      rightHalf,
      compare
    );
  }

  /**
   * Combines two sorted arrays into one sorted array.
   */
  private merge(
    left: Trip[],
    right: Trip[],
    compare: (first: Trip, second: Trip) => number
  ): Trip[] {
    const mergedTrips: Trip[] = [];

    let leftIndex = 0;
    let rightIndex = 0;

    while (
      leftIndex < left.length &&
      rightIndex < right.length
    ) {
      if (
        compare(
          left[leftIndex],
          right[rightIndex]
        ) <= 0
      ) {
        mergedTrips.push(left[leftIndex]);
        leftIndex++;
      } else {
        mergedTrips.push(right[rightIndex]);
        rightIndex++;
      }
    }

    while (leftIndex < left.length) {
      mergedTrips.push(left[leftIndex]);
      leftIndex++;
    }

    while (rightIndex < right.length) {
      mergedTrips.push(right[rightIndex]);
      rightIndex++;
    }

    return mergedTrips;
  }

  private toNumber(
    value: string | number
  ): number {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }

  private toDateValue(value: string): number {
    const dateValue = new Date(value).getTime();

    return Number.isFinite(dateValue)
      ? dateValue
      : 0;
  }
}