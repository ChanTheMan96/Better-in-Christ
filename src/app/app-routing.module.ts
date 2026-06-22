import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DonateComponent } from './donate/donate.component';
import { ContactComponent } from './contact/contact.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeRedirectComponent } from './pages/home-redirect/home-redirect.component';
import { dashboardAuthGuard } from './guards/dashboard-auth.guard';

const routes: Routes = [
  { path: '', component: HomeRedirectComponent, pathMatch: 'full' },
  {
    path: 'scroll',
    loadChildren: () => import('./faith-scroll/faith-scroll.module').then((m) => m.FaithScrollModule)
  },
  {
    path: 'faith-scroll',
    loadChildren: () => import('./faith-scroll/faith-scroll.module').then((m) => m.FaithScrollModule)
  },
  { path: 'donate', component: DonateComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [dashboardAuthGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
