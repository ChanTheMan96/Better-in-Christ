import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmotionsComponent } from './emotions/emotions.component';
import { WhoIAmComponent } from './who-i-am/who-i-am.component';
import { RelationshipGuideComponent } from './relationship-guide/relationship-guide.component';
import { SurrenderComponent } from './surrender/surrender.component';
import { PrayerComponent } from './prayer/prayer.component';
import { DonateComponent } from './donate/donate.component';

const routes: Routes = [
  { path: '', component: EmotionsComponent },
  {
    path: 'growth',
    loadChildren: () => import('./features/growth/growth.module').then((m) => m.GrowthModule)
  },
  {
    path: 'parent-blessings',
    loadChildren: () =>
      import('./features/parent-blessings/parent-blessings.module').then((m) => m.ParentBlessingsModule)
  },
  { path: 'who-i-am', component: WhoIAmComponent },
  { path: 'relationship-guide', component: RelationshipGuideComponent },
  { path: 'surrender', component: SurrenderComponent },
  { path: 'prayer', component: PrayerComponent },
  {
    path: 'faith-scroll',
    loadChildren: () => import('./faith-scroll/faith-scroll.module').then((m) => m.FaithScrollModule)
  },
  { path: 'donate', component: DonateComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
