import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmotionCategory } from 'src/app/data/emotions.data';

@Component({
  selector: 'app-battle-picker',
  standalone: true,
  templateUrl: './battle-picker.component.html',
  styleUrl: './battle-picker.component.scss',
})
export class BattlePickerComponent {
  @Input() emotions: EmotionCategory[] = [];
  @Input() selectedBattles: string[] = [];
  @Input() maxBattles = 5;
  @Input() isSavingBattles = false;

  @Output() closePicker = new EventEmitter<void>();
  @Output() toggleBattle = new EventEmitter<string>();
  @Output() removeBattle = new EventEmitter<string>();
  @Output() clearBattles = new EventEmitter<void>();
  @Output() saveBattles = new EventEmitter<void>();

  isBattleSelected(emotion: string): boolean {
    return this.selectedBattles.includes(emotion);
  }

  isBattleDisabled(emotion: string): boolean {
    return (
      this.selectedBattles.length >= this.maxBattles &&
      !this.isBattleSelected(emotion)
    );
  }
}
