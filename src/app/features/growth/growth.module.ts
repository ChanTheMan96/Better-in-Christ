import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SharedModule } from '../../shared/shared.module';
import { GrowthDetailComponent } from './growth-detail.component';
import { GrowthSelectionComponent } from './growth-selection.component';
import { GrowthVersesComponent } from './growth-verses.component';

const routes: Routes = [
  { path: '', component: GrowthSelectionComponent },
  { path: ':trait/verses', component: GrowthVersesComponent },
  { path: ':trait', component: GrowthDetailComponent }
];

@NgModule({
  declarations: [
    GrowthSelectionComponent,
    GrowthDetailComponent,
    GrowthVersesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzGridModule,
    NzIconModule
  ]
})
export class GrowthModule {}
