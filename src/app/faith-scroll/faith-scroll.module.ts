import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FaithScrollComponent } from './faith-scroll.component';

const routes: Routes = [
  { path: '', component: FaithScrollComponent }
];

@NgModule({
  declarations: [
    FaithScrollComponent
  ],
  imports: [
    CommonModule,
    NzIconModule,
    RouterModule.forChild(routes)
  ]
})
export class FaithScrollModule {}
