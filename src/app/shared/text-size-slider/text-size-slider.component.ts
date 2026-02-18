import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-text-size-slider',
  templateUrl: './text-size-slider.component.html',
  styleUrls: ['./text-size-slider.component.scss']
})
export class TextSizeSliderComponent {
  @Input() label = 'Reading Comfort';
  @Input() value = 16;
  @Input() min = 14;
  @Input() max = 24;
  @Input() step = 1;

  @Output() valueChange = new EventEmitter<number>();

  onValueChange(next: number): void {
    this.valueChange.emit(next);
  }
}

