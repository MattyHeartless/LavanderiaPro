import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

type GoogleMapsWindow = Window & {
  google?: { maps?: { importLibrary: (library: string) => Promise<any> } };
};

@Injectable({ providedIn: 'root' })
export class GooglePlacesLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    const googleWindow = window as GoogleMapsWindow;
    if (googleWindow.google?.maps?.importLibrary) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;
    if (!environment.googleMapsApiKey) return Promise.reject(new Error('Google Maps API key is not configured.'));

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-api]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Google Maps could not be loaded.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.dataset['googleMapsApi'] = 'true';
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(environment.googleMapsApiKey)}&libraries=places&language=es&region=MX&v=weekly`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps could not be loaded.'));
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
