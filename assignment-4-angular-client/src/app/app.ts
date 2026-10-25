import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Toasts } from './shared/components/toasts/toasts';

/** Root shell: sticky header, routed page, toast notifications. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
