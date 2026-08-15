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
import { Router, RouterLink } from '@angular/router';

import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-add-trip',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './add-trip.html',
  styleUrl: './add-trip.css'
})
export class AddTrip implements OnInit {
  addForm!: FormGroup;

  submitted = false;
  isSubmitting = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly tripData: TripData,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.addForm = this.formBuilder.group({
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

      start: [
        '',
        Validators.required
      ],

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
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const newTrip: Trip = {
      ...this.addForm.value,
      code: this.addForm.value.code.trim().toUpperCase(),
      name: this.addForm.value.name.trim(),
      resort: this.addForm.value.resort.trim(),
      image: this.addForm.value.image.trim(),
      description: this.addForm.value.description.trim(),
      length: Number(this.addForm.value.length),
      perPerson: Number(this.addForm.value.perPerson)
    };

    this.tripData.addTrip(newTrip).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Trip added successfully.';

        this.router.navigate(['']);
      },

      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;

        if (error.status === 400) {
          const details = Array.isArray(error.error?.details)
            ? error.error.details.join(' ')
            : '';

          this.errorMessage =
            details ||
            error.error?.message ||
            'The trip contains invalid information.';
        } else if (error.status === 401) {
          this.errorMessage =
            'Your session has expired. Please log in again.';
        } else if (error.status === 409) {
          this.errorMessage =
            error.error?.message ||
            'A trip with that code already exists.';
        } else {
          this.errorMessage =
            error.error?.message ||
            'The trip could not be added. Please try again.';
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  get f() {
    return this.addForm.controls;
  }
}