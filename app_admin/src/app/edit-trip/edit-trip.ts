import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-edit-trip',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './edit-trip.html',
  styleUrl: './edit-trip.css'
})
export class EditTrip implements OnInit {
  editForm!: FormGroup;

  submitted = false;
  isSubmitting = false;
  isLoading = true;

  errorMessage = '';
  successMessage = '';

  tripCode = '';
  originalTripCode = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripData: TripData,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.editForm = this.formBuilder.group({
      _id: [''],

      code: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[A-Za-z0-9-]+$/)
        ]
      ],

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      ],

      length: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d*$/)
        ]
      ],

      start: ['', Validators.required],

      resort: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100)
        ]
      ],

      perPerson: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/)
        ]
      ],

      image: [
        '',
        [
          Validators.required,
          Validators.maxLength(255)
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(1000)
        ]
      ]
    });

    this.tripCode =
      this.route.snapshot.queryParamMap
        .get('code')
        ?.trim() ?? '';

    if (!this.tripCode) {
      this.isLoading = false;
      this.errorMessage =
        'No trip code was provided. Return to the trip list and try again.';

      this.changeDetector.detectChanges();
      return;
    }

    this.loadTrip();
  }

  private loadTrip(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.tripData.getTrip(this.tripCode).subscribe({
      next: (trip: Trip) => {
        this.originalTripCode = trip.code;

        this.editForm.patchValue({
          ...trip,
          start: trip.start
            ? trip.start.substring(0, 10)
            : ''
        });

        this.isLoading = false;
        this.changeDetector.detectChanges();
      },

      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 404) {
          this.errorMessage =
            'The requested trip could not be found.';
        } else if (error.status === 401) {
          this.errorMessage =
            'Your session has expired. Please log in again.';
        } else {
          this.errorMessage =
            error.error?.message ||
            'The trip could not be loaded. Please try again.';
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    if (!this.originalTripCode) {
      this.errorMessage =
        'The original trip code is unavailable. Reload the page and try again.';

      this.changeDetector.detectChanges();
      return;
    }

    this.isSubmitting = true;

    const updatedTrip: Trip = {
      ...this.editForm.value,
      code: this.editForm.value.code
        .trim()
        .toUpperCase(),
      name: this.editForm.value.name.trim(),
      resort: this.editForm.value.resort.trim(),
      image: this.editForm.value.image.trim(),
      description:
        this.editForm.value.description.trim(),
      length: Number(this.editForm.value.length),
      perPerson: Number(
        this.editForm.value.perPerson
      )
    };

    this.tripData
      .updateTrip(
        this.originalTripCode,
        updatedTrip
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage =
            'Trip updated successfully.';

          this.changeDetector.detectChanges();
          this.router.navigate(['']);
        },

        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;

          if (error.status === 400) {
            const details = Array.isArray(
              error.error?.details
            )
              ? error.error.details.join(' ')
              : '';

            this.errorMessage =
              details ||
              error.error?.message ||
              'The trip contains invalid information.';
          } else if (error.status === 401) {
            this.errorMessage =
              'Your session has expired. Please log in again.';
          } else if (error.status === 404) {
            this.errorMessage =
              'The trip could not be found.';
          } else if (error.status === 409) {
            this.errorMessage =
              error.error?.message ||
              'A trip with that code already exists.';
          } else {
            this.errorMessage =
              error.error?.message ||
              'The trip could not be updated. Please try again.';
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  get f() {
    return this.editForm.controls;
  }
}