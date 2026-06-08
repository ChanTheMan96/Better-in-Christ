import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SharedModule } from '../../shared/shared.module';
import { ParentBlessingsDetailComponent } from './parent-blessings-detail.component';
import { ParentBlessingsSelectionComponent } from './parent-blessings-selection.component';
import { ParentBlessingsVersesComponent } from './parent-blessings-verses.component';

const routes: Routes = [
  { path: '', component: ParentBlessingsSelectionComponent },
  { path: ':category/verses', component: ParentBlessingsVersesComponent },
  { path: ':category', component: ParentBlessingsDetailComponent }
];

@NgModule({
  declarations: [
    ParentBlessingsSelectionComponent,
    ParentBlessingsDetailComponent,
    ParentBlessingsVersesComponent
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
export class ParentBlessingsModule {}
