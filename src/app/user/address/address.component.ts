import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DivIcon, LatLngExpression, LeafletMouseEvent, Map, Marker } from 'leaflet';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { UtilService } from '../../shared/util';
import { Addresses, ProfileService } from '../services/profile.service';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface GeocodeCandidate {
  label: string;
  query: string;
  restrictToMexico: boolean;
}

const DEFAULT_MAP_CENTER: [number, number] = [20.6736, -103.344];
const DEFAULT_MAP_ZOOM = 13;
type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-address',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './address.component.html',
  styleUrl: './address.component.css'
})
export class AddressComponent implements OnDestroy {
  newAddressData: Addresses = this.createEmptyAddress();
  showaddressform = false;
  user_session: any = null;
  addresses: Addresses[] = [];
  isEditing = false;
  showDeleteModal = false;
  selectedAddress: Addresses | null = null;
  isSaving = false;
  isLocatingAddress = false;
  geocodeError = '';
  geocodeStatus = 'Completa la dirección y ubícala en el mapa.';
  private lastResolvedAddressQuery = '';

  private leaflet: LeafletModule | null = null;
  private map: Map | null = null;
  private mapMarker: Marker | null = null;

  constructor(
    private profileService: ProfileService,
    private http: HttpClient,
    public util: UtilService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadAddresses();
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  toggleAddressForm(): void {
    if (this.showaddressform) {
      this.resetForm();
      return;
    }

    this.openAddressForm();
  }

  loadAddresses(): void {
    const userId = this.user_session.id;
    console.log('Loading addresses for userId:', userId);
    this.profileService.getAddress(userId).subscribe({
      next: (data: any) => {
        this.addresses = data.addresses;
        console.log('Addresses loaded:', this.addresses);
      },
      error: (err) => {
        console.error('Error loading addresses:', err);
      }
    });
  }

  loadUserData() {
    const data = localStorage.getItem('user_session');

    if (data) {
      try {
        this.user_session = JSON.parse(data);
        console.log('User session cargada:', this.user_session);
      } catch (error) {
        console.error('Error al parsear datos del localStorage', error);
      }
    }
  }

  saveAddress(): void {
    if (!this.hasCoordinates) {
      this.geocodeError = 'Ubica la dirección en el mapa antes de guardarla.';
      return;
    }

    this.isSaving = true;

    if (this.isEditing) {
      this.profileService.updateAddress(this.newAddressData).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadAddresses();
          this.resetForm();
        },
        error: (err) => {
          this.isSaving = false;
          this.geocodeError = 'No fue posible actualizar la dirección.';
          console.error('Error updating address:', err);
        }
      });
      return;
    }

    this.newAddressData.userId = this.user_session.id;
    this.profileService.saveAddress(this.newAddressData).subscribe({
      next: (response) => {
        this.isSaving = false;
        console.log('Address saved successfully:', response);
        this.loadAddresses();
        this.resetForm();
      },
      error: (err) => {
        this.isSaving = false;
        this.geocodeError = 'No fue posible guardar la dirección.';
        console.error('Error saving address:', err);
      }
    });
  }

  loadAddressData(address: Addresses) {
    this.isEditing = true;
    this.showaddressform = true;
    this.geocodeError = '';
    this.geocodeStatus = this.hasAddressCoordinates(address)
      ? 'Coordenadas cargadas desde la dirección guardada.'
      : 'La dirección no tiene coordenadas guardadas. Ubícala en el mapa.';
    this.newAddressData = {
      ...address,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null
    };
    this.lastResolvedAddressQuery = this.buildAddressQuery();
    console.log('Address to edit:', this.newAddressData);
    this.initializeMapOnNextTick();
  }

  resetForm() {
    this.isEditing = false;
    this.isSaving = false;
    this.isLocatingAddress = false;
    this.geocodeError = '';
    this.geocodeStatus = 'Completa la dirección y ubícala en el mapa.';
    this.lastResolvedAddressQuery = '';
    this.newAddressData = this.createEmptyAddress();
    this.showaddressform = false;
    this.destroyMap();
  }

  onAddressFieldChange() {
    if (!this.showaddressform) {
      return;
    }

    const currentQuery = this.buildAddressQuery();

    if (!currentQuery) {
      this.clearCoordinates('Completa la dirección y ubícala en el mapa.');
      return;
    }

    if (currentQuery !== this.lastResolvedAddressQuery) {
      this.clearCoordinates('La dirección cambió. Debes volver a ubicarla en el mapa antes de guardar.');
    }
  }

  openDeleteModal(address: Addresses) {
    this.selectedAddress = address;
    this.showDeleteModal = true;
  }

  confirmDelete(addressToDelete: Addresses | null) {
    if (!addressToDelete?.id) {
      return;
    }

    this.profileService.deleteAddress(addressToDelete.id, this.user_session.id).subscribe({
      next: () => {
        this.loadAddresses();
        this.showDeleteModal = false;
        this.selectedAddress = null;
      },
      error: (err) => {
        console.error('Error al eliminar dirección:', err);
      }
    });
  }

  scrollToForm() {
    if (!this.showaddressform) {
      this.openAddressForm();
    }

    setTimeout(() => {
      const element = document.getElementById('new_addressform');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }

  searchAddressOnMap() {
    const candidates = this.buildGeocodeCandidates();

    if (!candidates.length) {
      this.geocodeError = 'Completa la dirección para ubicarla en el mapa.';
      return;
    }

    this.isLocatingAddress = true;
    this.geocodeError = '';
    this.geocodeStatus = 'Buscando la ubicación...';
    void this.runGeocodeSearch(candidates);
  }

  get hasCoordinates(): boolean {
    return this.hasAddressCoordinates(this.newAddressData);
  }

  get coordinatesLabel(): string {
    if (!this.hasCoordinates) {
      return 'Sin coordenadas seleccionadas';
    }

    return `${this.newAddressData.latitude?.toFixed(6)}, ${this.newAddressData.longitude?.toFixed(6)}`;
  }

  private openAddressForm() {
    this.showaddressform = true;
    this.geocodeError = '';
    this.geocodeStatus = 'Completa la dirección y ubícala en el mapa.';
    this.lastResolvedAddressQuery = '';
    this.newAddressData = this.createEmptyAddress();
    this.initializeMapOnNextTick();
  }

  private initializeMapOnNextTick() {
    setTimeout(() => {
      void this.initializeMap();
    }, 0);
  }

  private async initializeMap() {
    const container = document.getElementById('address-map');

    if (!container) {
      return;
    }

    const leaflet = await this.loadLeaflet();

    this.destroyMap();

    this.map = leaflet.map(container, {
      zoomControl: true
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (event: LeafletMouseEvent) => {
      this.setCoordinates(event.latlng.lat, event.latlng.lng, 'Coordenadas ajustadas manualmente desde el mapa.');
    });

    if (this.hasCoordinates) {
      this.setCoordinates(this.newAddressData.latitude!, this.newAddressData.longitude!, 'Coordenadas cargadas desde la dirección.');
    }
  }

  private setCoordinates(latitude: number, longitude: number, statusMessage: string) {
    this.newAddressData.latitude = Number(latitude.toFixed(6));
    this.newAddressData.longitude = Number(longitude.toFixed(6));
    this.lastResolvedAddressQuery = this.buildAddressQuery();
    this.geocodeError = '';

    if (!this.map || !this.leaflet) {
      return;
    }

    const position: LatLngExpression = [latitude, longitude];

    if (!this.mapMarker) {
      this.mapMarker = this.leaflet.marker(position, {
        draggable: true,
        icon: this.createMapPinIcon(this.leaflet)
      }).addTo(this.map);

      this.mapMarker.on('dragend', () => {
        const point = this.mapMarker?.getLatLng();

        if (!point) {
          return;
        }

        this.setCoordinates(point.lat, point.lng, 'Coordenadas ajustadas arrastrando el pin.');
      });
    } else {
      this.mapMarker.setLatLng(position);
    }

    this.geocodeStatus = `${statusMessage} Coordenadas: ${this.coordinatesLabel}`;
    this.map.setView(position, 16);
  }

  private buildAddressQuery(): string {
    return [
      this.newAddressData.street,
      this.newAddressData.neighbourhood,
      this.newAddressData.city,
      this.newAddressData.state,
      this.newAddressData.zipCode,
      this.getCountryLabel(this.newAddressData.country)
    ]
      .filter(Boolean)
      .join(', ');
  }

  private buildGeocodeCandidates(): GeocodeCandidate[] {
    const street = this.newAddressData.street?.trim();
    const neighbourhood = this.newAddressData.neighbourhood?.trim();
    const city = this.newAddressData.city?.trim();
    const state = this.newAddressData.state?.trim();
    const zipCode = this.newAddressData.zipCode?.trim();
    const country = this.getCountryLabel(this.newAddressData.country);

    const variants: GeocodeCandidate[] = [
      {
        label: 'direccion-completa',
        query: [street, neighbourhood, city, state, zipCode, country].filter(Boolean).join(', '),
        restrictToMexico: true
      },
      {
        label: 'sin-colonia',
        query: [street, city, state, zipCode, country].filter(Boolean).join(', '),
        restrictToMexico: true
      },
      {
        label: 'sin-cp',
        query: [street, neighbourhood, city, state, country].filter(Boolean).join(', '),
        restrictToMexico: true
      },
      {
        label: 'basica',
        query: [street, city, state, country].filter(Boolean).join(', '),
        restrictToMexico: true
      },
      {
        label: 'cp-y-ciudad',
        query: [zipCode, city, state, country].filter(Boolean).join(', '),
        restrictToMexico: true
      },
      {
        label: 'sin-restriccion-pais',
        query: [street, neighbourhood, city, state, zipCode, country].filter(Boolean).join(', '),
        restrictToMexico: false
      }
    ];

    return variants.filter((candidate, index, array) => {
      if (!candidate.query) {
        return false;
      }

      return array.findIndex((item) => item.query === candidate.query && item.restrictToMexico === candidate.restrictToMexico) === index;
    });
  }

  private getCountryLabel(country: string): string {
    return country === 'MX' ? 'Mexico' : country;
  }

  private async runGeocodeSearch(candidates: GeocodeCandidate[]) {
    try {
      for (const candidate of candidates) {
        const results = await this.searchCandidate(candidate);

        if (!results.length) {
          continue;
        }

        const result = results[0];
        this.setCoordinates(Number(result.lat), Number(result.lon), 'Dirección ubicada. Puedes mover el pin para afinarla.');
        this.lastResolvedAddressQuery = this.buildAddressQuery();
        this.geocodeStatus = result.display_name;
        this.isLocatingAddress = false;
        return;
      }

      this.geocodeError = 'No encontré esa dirección. Ajusta los datos o marca el punto manualmente en el mapa.';
      this.geocodeStatus = 'No se encontró una coincidencia usable.';
      this.isLocatingAddress = false;
    } catch (err) {
      this.isLocatingAddress = false;
      this.geocodeError = 'No fue posible consultar el mapa en este momento.';
      this.geocodeStatus = 'No se pudo consultar el servicio de geocodificación.';
      console.error('Error locating address:', err);
    }
  }

  private async searchCandidate(candidate: GeocodeCandidate): Promise<NominatimResult[]> {
    let params = new HttpParams()
      .set('format', 'jsonv2')
      .set('limit', '1')
      .set('addressdetails', '1')
      .set('accept-language', 'es-MX')
      .set('q', candidate.query);

    if (candidate.restrictToMexico) {
      params = params.set('countrycodes', 'mx');
    }

    const results = await firstValueFrom(this.http.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', { params }));
    return results ?? [];
  }

  private hasAddressCoordinates(address: Addresses): boolean {
    return typeof address.latitude === 'number' && typeof address.longitude === 'number';
  }

  private clearCoordinates(statusMessage: string) {
    this.newAddressData.latitude = null;
    this.newAddressData.longitude = null;
    this.lastResolvedAddressQuery = '';
    this.geocodeError = '';
    this.geocodeStatus = statusMessage;

    if (this.mapMarker) {
      this.mapMarker.remove();
      this.mapMarker = null;
    }
  }

  private async loadLeaflet(): Promise<LeafletModule> {
    if (this.leaflet) {
      return this.leaflet;
    }

    this.leaflet = await import('leaflet/dist/leaflet-src.esm.js') as LeafletModule;
    return this.leaflet;
  }

  private createMapPinIcon(leaflet: LeafletModule): DivIcon {
    return leaflet.divIcon({
      className: 'address-map-pin',
      html: '<span class="material-symbols-outlined">location_on</span>',
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.mapMarker = null;
  }

  private createEmptyAddress(): Addresses {
    return {
      title: '',
      userId: '',
      street: '',
      city: '',
      neighbourhood: '',
      state: 'Jalisco',
      zipCode: '',
      country: 'MX',
      latitude: null,
      longitude: null
    };
  }
}
