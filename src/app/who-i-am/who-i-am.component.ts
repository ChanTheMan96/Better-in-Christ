import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TextSizeService } from '../services/text-size.service';

@Component({
    selector: 'app-who-i-am',
    templateUrl: './who-i-am.component.html',
    styleUrls: ['./who-i-am.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class WhoIAmComponent implements OnInit {
  verseTextSize = 16;

  constructor(private textSizeService: TextSizeService) {}

  ngOnInit(): void {
    this.verseTextSize = this.textSizeService.getVerseTextSize();
  }

  onVerseTextSizeChange(size: number): void {
    this.textSizeService.setVerseTextSize(size);
  }
}
