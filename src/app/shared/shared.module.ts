import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ScriptureVersesComponent } from './scripture-verses/scripture-verses.component';
import { TextSizeSliderComponent } from './text-size-slider/text-size-slider.component';

@NgModule({
  declarations: [
    ScriptureVersesComponent,
    TextSizeSliderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NzAlertModule,
    NzPaginationModule,
    NzSliderModule,
    NzSpinModule
  ],
  exports: [
    ScriptureVersesComponent,
    TextSizeSliderComponent
  ]
})
export class SharedModule {}
