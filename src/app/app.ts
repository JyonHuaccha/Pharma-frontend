import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisosComponent } from './shared/avisos/avisos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisosComponent],
  template: `<router-outlet /><app-avisos />`,
  styles: [`:host { display: block; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }`],
})
export class App {}
