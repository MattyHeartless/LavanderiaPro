import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AccountMenuComponent } from '../../shared/account-menu/account-menu.component';
import { GooglePlacesLoaderService } from '../../shared/google-places-loader.service';
import { NotificationService } from '../../shared/notification.service';
import { UtilService } from '../../shared/util';
import { Addresses, ProfileService } from '../services/profile.service';

type GoogleMapsWindow = Window & {
  google?: { maps?: { importLibrary: (library: string) => Promise<any> } };
};

@Component({
  selector: 'app-address',
  imports: [RouterLink, CommonModule, FormsModule, AccountMenuComponent],
  templateUrl: './address.component.html',
  styleUrl: './address.component.css'
})
export class AddressComponent implements OnDestroy {
  newAddressData: Addresses = this.createEmptyAddress();
  isMobileMenuOpen = false;
  showaddressform = false;
  user_session: any = null;
  addresses: Addresses[] = [];
  isEditing = false;
  showDeleteModal = false;
  selectedAddress: Addresses | null = null;
  isSaving = false;
  isLoadingAutocomplete = false;
  geocodeError = '';

  private autocompleteElement: HTMLElement | null = null;
  private lastSelectedAddressSignature = '';
  private isApplyingGooglePlace = false;

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private googlePlacesLoader: GooglePlacesLoaderService,
    private zone: NgZone,
    public util: UtilService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadAddresses();
  }

  ngOnDestroy(): void {
    this.autocompleteElement?.remove();
  }

  toggleAddressForm(): void {
    if (this.showaddressform) {
      this.resetForm();
      return;
    }
    this.openAddressForm();
  }

  toggleMobileMenu(): void { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  closeMobileMenu(): void { this.isMobileMenuOpen = false; }

  loadAddresses(): void {
    const userId = this.user_session?.id;
    if (!userId) return;

    this.profileService.getAddress(userId).subscribe({
      next: (data: any) => this.addresses = data.addresses ?? [],
      error: (err) => console.error('Error loading addresses:', err)
    });
  }

  loadUserData(): void {
    const data = this.authService.getStoredUserSession();
    if (data) this.user_session = data;
  }

  saveAddress(): void {
    if (!this.hasCoordinates) {
      this.geocodeError = 'Selecciona una dirección sugerida antes de guardarla.';
      return;
    }

    this.isSaving = true;
    const request: Observable<unknown> = (this.isEditing
      ? this.profileService.updateAddress(this.newAddressData)
      : this.profileService.saveAddress({ ...this.newAddressData, userId: this.user_session.id })) as Observable<unknown>;

    request.subscribe({
      next: () => {
        const savedMessage = this.isEditing ? 'Dirección actualizada correctamente.' : 'Dirección guardada correctamente.';
        this.isSaving = false;
        this.loadAddresses();
        this.resetForm();
        this.notifications.success(savedMessage);
      },
      error: (err: unknown) => {
        this.isSaving = false;
        this.geocodeError = 'No fue posible guardar la dirección.';
        this.notifications.error(err, this.geocodeError);
        console.error('Error saving address:', err);
      }
    });
  }

  loadAddressData(address: Addresses): void {
    this.isEditing = true;
    this.showaddressform = true;
    this.geocodeError = '';
    this.newAddressData = { ...address, latitude: address.latitude ?? null, longitude: address.longitude ?? null };
    this.lastSelectedAddressSignature = this.buildAddressSignature();
    this.initializeAutocompleteOnNextTick();
  }

  resetForm(): void {
    this.isEditing = false;
    this.isSaving = false;
    this.isLoadingAutocomplete = false;
    this.geocodeError = '';
    this.lastSelectedAddressSignature = '';
    this.newAddressData = this.createEmptyAddress();
    this.showaddressform = false;
    this.autocompleteElement?.remove();
    this.autocompleteElement = null;
  }

  onAddressFieldChange(): void {
    if (!this.showaddressform || this.isApplyingGooglePlace || !this.hasCoordinates) return;
    if (this.buildAddressSignature() !== this.lastSelectedAddressSignature) {
      this.clearCoordinates();
    }
  }

  openDeleteModal(address: Addresses): void {
    this.selectedAddress = address;
    this.showDeleteModal = true;
  }

  confirmDelete(addressToDelete: Addresses | null): void {
    if (!addressToDelete?.id) return;

    this.profileService.deleteAddress(addressToDelete.id, this.user_session.id).subscribe({
      next: () => {
        this.loadAddresses();
        this.showDeleteModal = false;
        this.selectedAddress = null;
        this.notifications.success('Dirección eliminada correctamente.');
      },
      error: (err) => {
        console.error('Error deleting address:', err);
        this.notifications.error(err, 'No fue posible eliminar la dirección.');
      }
    });
  }

  scrollToForm(): void {
    if (!this.showaddressform) this.openAddressForm();
    setTimeout(() => document.getElementById('new_addressform')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  get hasCoordinates(): boolean {
    return this.hasAddressCoordinates(this.newAddressData);
  }

  private openAddressForm(): void {
    this.showaddressform = true;
    this.geocodeError = '';
    this.lastSelectedAddressSignature = '';
    this.newAddressData = this.createEmptyAddress();
    this.initializeAutocompleteOnNextTick();
  }

  private initializeAutocompleteOnNextTick(): void {
    setTimeout(() => void this.initializeAutocomplete(), 0);
  }

  private async initializeAutocomplete(): Promise<void> {
    const host = document.getElementById('google-address-autocomplete');
    if (!host) return;

    this.autocompleteElement?.remove();
    host.replaceChildren();
    this.isLoadingAutocomplete = true;
    this.geocodeError = '';

    try {
      await this.googlePlacesLoader.load();
      const googleMaps = (window as GoogleMapsWindow).google;
      const { PlaceAutocompleteElement } = await googleMaps!.maps!.importLibrary('places');
      const autocomplete = new PlaceAutocompleteElement();

      autocomplete.placeholder = 'Empieza a escribir tu dirección';
      autocomplete.includedRegionCodes = ['mx'];
      autocomplete.classList.add('google-address-autocomplete');
      autocomplete.addEventListener('gmp-select', (event: Event) => {
        const prediction = (event as CustomEvent<any>).detail?.placePrediction ?? (event as any).placePrediction;
        if (prediction) void this.selectGooglePlace(prediction);
      });
      autocomplete.addEventListener('gmp-error', () => this.zone.run(() => {
        this.geocodeError = 'No fue posible buscar direcciones. Intenta de nuevo.';
      }));

      host.appendChild(autocomplete);
      this.autocompleteElement = autocomplete;
    } catch (error) {
      console.error('Unable to initialize Google Places:', error);
      this.geocodeError = 'No fue posible cargar el buscador de direcciones.';
    } finally {
      this.isLoadingAutocomplete = false;
    }
  }

  private async selectGooglePlace(prediction: any): Promise<void> {
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['formattedAddress', 'location', 'addressComponents'] });
      this.zone.run(() => this.applyGooglePlace(place));
    } catch (error) {
      console.error('Unable to retrieve Google place details:', error);
      this.zone.run(() => this.geocodeError = 'No fue posible obtener los datos de esa dirección.');
    }
  }

  private applyGooglePlace(place: any): void {
    const latitude = this.readCoordinate(place.location, 'lat');
    const longitude = this.readCoordinate(place.location, 'lng');
    if (latitude === null || longitude === null) {
      this.clearCoordinates();
      return;
    }

    this.isApplyingGooglePlace = true;
    const components = this.readAddressComponents(place.addressComponents ?? []);
    this.newAddressData.street = [components['streetNumber'], components['route']].filter(Boolean).join(' ') || place.formattedAddress || '';
    this.newAddressData.neighbourhood = components['neighbourhood'] || this.newAddressData.neighbourhood;
    this.newAddressData.city = components['city'] || this.newAddressData.city;
    this.newAddressData.state = components['state'] || this.newAddressData.state;
    this.newAddressData.zipCode = components['zipCode'] || this.newAddressData.zipCode;
    this.newAddressData.country = components['countryCode'] === 'MX' ? 'MX' : this.newAddressData.country;
    this.newAddressData.latitude = Number(latitude.toFixed(6));
    this.newAddressData.longitude = Number(longitude.toFixed(6));
    this.lastSelectedAddressSignature = this.buildAddressSignature();
    this.geocodeError = '';
    this.isApplyingGooglePlace = false;
  }

  private readCoordinate(location: any, axis: 'lat' | 'lng'): number | null {
    if (!location) return null;
    const value = typeof location[axis] === 'function' ? location[axis]() : location[axis];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private readAddressComponents(addressComponents: any[]): Record<string, string> {
    const values: Record<string, string> = {};
    for (const component of addressComponents) {
      const types: string[] = component.types ?? [];
      const value = component.longText ?? component.long_name ?? '';
      const shortValue = component.shortText ?? component.short_name ?? '';
      if (types.includes('street_number')) values['streetNumber'] = value;
      if (types.includes('route')) values['route'] = value;
      if (types.includes('neighborhood') || types.includes('sublocality') || types.includes('sublocality_level_1')) values['neighbourhood'] ??= value;
      if (types.includes('locality')) values['city'] = value;
      if (types.includes('administrative_area_level_1')) values['state'] = value;
      if (types.includes('postal_code')) values['zipCode'] = value;
      if (types.includes('country')) values['countryCode'] = shortValue;
    }
    return values;
  }

  private clearCoordinates(): void {
    this.newAddressData.latitude = null;
    this.newAddressData.longitude = null;
    this.lastSelectedAddressSignature = '';
    this.geocodeError = '';
  }

  private hasAddressCoordinates(address: Addresses): boolean {
    return typeof address.latitude === 'number' && typeof address.longitude === 'number';
  }

  private buildAddressSignature(): string {
    return [this.newAddressData.street, this.newAddressData.neighbourhood, this.newAddressData.city, this.newAddressData.state, this.newAddressData.zipCode, this.newAddressData.country]
      .map(value => value?.trim().toLowerCase() ?? '')
      .join('|');
  }

  private createEmptyAddress(): Addresses {
    return { title: '', userId: '', street: '', city: '', neighbourhood: '', state: 'Jalisco', zipCode: '', country: 'MX', latitude: null, longitude: null };
  }
}
