import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MensHelpComponent } from './mens-help/mens-help.component';
import { WhoIAmComponent } from './who-i-am/who-i-am.component';
import { RelationshipGuideComponent } from './relationship-guide/relationship-guide.component';
import { SurrenderComponent } from './surrender/surrender.component';
import { PrayerComponent } from './prayer/prayer.component';
import { GrowthSelectionComponent } from './features/growth/growth-selection.component';
import { GrowthDetailComponent } from './features/growth/growth-detail.component';
import { GrowthVersesComponent } from './features/growth/growth-verses.component';
import { ParentBlessingsSelectionComponent } from './features/parent-blessings/parent-blessings-selection.component';
import { ParentBlessingsDetailComponent } from './features/parent-blessings/parent-blessings-detail.component';
import { ParentBlessingsVersesComponent } from './features/parent-blessings/parent-blessings-verses.component';
import { FaithScrollComponent } from './faith-scroll/faith-scroll.component';
import { DonateComponent } from './donate/donate.component';

const routes: Routes = [
  { path: '', component: MensHelpComponent },
  { path: 'growth', component: GrowthSelectionComponent },
  { path: 'growth/:trait/verses', component: GrowthVersesComponent },
  { path: 'growth/:trait', component: GrowthDetailComponent },
  { path: 'parent-blessings', component: ParentBlessingsSelectionComponent },
  { path: 'parent-blessings/:category/verses', component: ParentBlessingsVersesComponent },
  { path: 'parent-blessings/:category', component: ParentBlessingsDetailComponent },
  { path: 'who-i-am', component: WhoIAmComponent },
  { path: 'relationship-guide', component: RelationshipGuideComponent },
  { path: 'surrender', component: SurrenderComponent },
  { path: 'prayer', component: PrayerComponent },
  { path: 'faith-scroll', component: FaithScrollComponent },
  { path: 'donate', component: DonateComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
