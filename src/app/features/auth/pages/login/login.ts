import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { rutaInterna } from '../../../../core/auth/ruta-interna';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly returnUrl = input<string>();
  readonly expirada = input<string>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);
  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/\S/)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  ingresar(): void {
    if (this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.enviando.set(true);
    this.auth.login(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void this.router.navigateByUrl(rutaInterna(this.returnUrl()) ?? '/inicio'); },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.form.controls.password.reset();
        this.error.set(error instanceof HttpErrorResponse ? mensajeError(error) : 'No se pudo iniciar sesión. Inténtelo nuevamente.');
      },
    });
  }
}
