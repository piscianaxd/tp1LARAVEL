import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
//import { coverplayerComponent } from './pages/cover-player/cover-player.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, /*coverplayerComponent*/],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
})
export class AppComponent {
  title = 'Musify';
}