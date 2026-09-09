import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UtilService } from '../util';

@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.css'
})
export class AccountMenuComponent {
  isOpen = false;
  constructor(public readonly util: UtilService) {}
  toggle(): void { this.isOpen = !this.isOpen; }
  close(): void { this.isOpen = false; }
  @HostListener('document:keydown.escape') onEscape(): void { this.close(); }
}
