import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, UserCoupon } from '../../services/auth.service';
import { UtilService } from '../../shared/util';

@Component({
  selector: 'app-coupons',
  imports: [RouterLink, CommonModule],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.css'
})
export class CouponsComponent {
  coupons: UserCoupon[] = [];
  user_session: any = null;
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    public util: UtilService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.getCoupons();
  }

  loadUserData() {
    const data = localStorage.getItem('user_session');

    if (data) {
      try {
        this.user_session = JSON.parse(data);
      } catch (error) {
        console.error('Error al parsear datos del localStorage', error);
      }
    }
  }

  getCoupons() {
    const userId = this.user_session?.id || this.user_session?.userId;

    if (!userId) {
      this.errorMessage = 'No fue posible identificar al usuario actual.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.getUserCoupons(userId).subscribe({
      next: (response) => {
        this.coupons = response;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No fue posible cargar tus cupones.';
        console.error('Error loading user coupons:', error);
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) {
      return 'Sin fecha';
    }

    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CREATED':
        return 'Disponible';
      case 'REDEEMED':
        return 'Usado';
      case 'EXPIRED':
        return 'Expirado';
      default:
        return status;
    }
  }

  getStatusTheme(status: string): string {
    switch (status) {
      case 'CREATED':
        return 'bg-emerald-100 text-emerald-700';
      case 'REDEEMED':
        return 'bg-slate-200 text-slate-700';
      case 'EXPIRED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  getBenefitLabel(coupon: UserCoupon): string {
    if (coupon.benefitTypeSnapshot === 'percentage') {
      return `${coupon.benefitValueSnapshot}% de descuento`;
    }

    return `$${coupon.benefitValueSnapshot} de descuento`;
  }
}
