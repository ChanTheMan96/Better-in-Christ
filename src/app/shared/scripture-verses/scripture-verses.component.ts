import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ScriptureDisplayVerse {
  reference: string;
  text: string;
  version?: string;
}

@Component({
  selector: 'app-scripture-verses',
  templateUrl: './scripture-verses.component.html',
  styleUrls: ['./scripture-verses.component.scss']
})
export class ScriptureVersesComponent {
  @Input() loading = false;
  @Input() loadingText = 'Loading Bible...';
  @Input() verses: ScriptureDisplayVerse[] = [];

  @Input() verseTextSize = 16;
  @Output() verseTextSizeChange = new EventEmitter<number>();

  @Input() showSlider = true;
  @Input() sliderLabel = 'Reading Comfort';
  @Input() sliderMin = 14;
  @Input() sliderMax = 24;
  @Input() sliderStep = 1;

  @Input() showPagination = false;
  @Input() pageIndex = 1;
  @Input() pageSize = 4;
  @Input() total = 0;
  @Output() pageIndexChange = new EventEmitter<number>();

  onTextSizeChange(size: number): void {
    this.verseTextSizeChange.emit(size);
  }

  onPageChange(page: number): void {
    this.pageIndexChange.emit(page);
  }
}
