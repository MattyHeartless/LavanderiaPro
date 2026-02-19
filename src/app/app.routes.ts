import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './user/profile/profile.component';
import { AddressComponent } from './user/address/address.component';
import { PaymentMethodsComponent } from './user/payment-methods/payment-methods.component';
import { RecollectionOrdersComponent } from './user/recollection-orders/recollection-orders.component';
import { NewRecollectionComponent } from './user/new-recollection/new-recollection.component';
import { RecollectionReceivedComponent } from './user/recollection-received/recollection-received.component';

// Importamos el guard que creamos
import { authGuard } from './auth.guard'; 

export const routes: Routes = [
    // Rutas públicas
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },

    // Rutas protegidas (Requieren 'user_session')
    { 
        path: 'profile', 
        component: ProfileComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'address', 
        component: AddressComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'payment-methods', 
        component: PaymentMethodsComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'recollection-orders', 
        component: RecollectionOrdersComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'new-recollection', 
        component: NewRecollectionComponent, 
        canActivate: [authGuard] 
    },
    { 
        path: 'recollection-received', 
        component: RecollectionReceivedComponent, 
        canActivate: [authGuard] 
    },
];