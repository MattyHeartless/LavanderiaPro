import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideHotToastConfig } from '@ngxpert/hot-toast';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideHttpClient(),provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })), provideHotToastConfig({
      position: 'top-right',
      duration: 4200,
      dismissible: true,
      className: 'laundry-toast',
      success: { className: 'laundry-toast laundry-toast--success', iconTheme: { primary: '#0f766e', secondary: '#ffffff' } },
      error: { className: 'laundry-toast laundry-toast--error', duration: 5500, iconTheme: { primary: '#b42318', secondary: '#ffffff' } },
      warning: { className: 'laundry-toast laundry-toast--warning', iconTheme: { primary: '#a16207', secondary: '#ffffff' } },
      info: { className: 'laundry-toast laundry-toast--info', iconTheme: { primary: '#2563eb', secondary: '#ffffff' } }
    })]
};
