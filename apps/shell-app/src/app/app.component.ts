import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }
    `,
  ],
  standalone: true,
})
export class AppComponent {
  title = 'XONT Ventura CRM';
}
