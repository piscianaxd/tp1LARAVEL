import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor.service';
import { PlayerEventsService } from './services/player-events.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    PlayerEventsService,
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
