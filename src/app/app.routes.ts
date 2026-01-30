import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './user/profile/profile.component';
import { AddressComponent } from './user/address/address.component';
import { PaymentMethodsComponent } from './user/payment-methods/payment-methods.component';
import { RecollectionOrdersComponent } from './user/recollection-orders/recollection-orders.component';
import { NewRecollectionComponent } from './user/new-recollection/new-recollection.component';
import { RecollectionReceivedComponent } from './user/recollection-received/recollection-received.component';

export const routes: Routes = [
    {path: '', component:HomeComponent},
    {path: 'home', component:HomeComponent},
    {path: 'register', component:RegisterComponent },
    {path: 'login',component:LoginComponent},
    {path: 'profile', component:ProfileComponent},
    {path: 'address', component:AddressComponent},
    {path: 'payment-methods',component:PaymentMethodsComponent},
    {path: 'recollection-orders',component:RecollectionOrdersComponent},
    {path: 'new-recollection',component:NewRecollectionComponent},
    {path: 'recollection-received',component:RecollectionReceivedComponent},

];
