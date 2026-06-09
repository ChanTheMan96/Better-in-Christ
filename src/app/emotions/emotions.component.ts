import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BibleService } from '../services/bible.service';
import { NavigationService } from '../services/navigation.service';
import { TextSizeService } from '../services/text-size.service';
import { BibleVersionService } from '../services/bible-version.service';
import { from, of, Subject } from 'rxjs';
import { concatMap, toArray, map, catchError, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { EMOTIONS, EmotionCategory } from '../data/emotions.data';

interface EmotionItem extends EmotionCategory {
  relevantVerses: Array<{ reference: string; version: string; text: string }>;
}

@Component({
    selector: 'app-emotions',
    templateUrl: './emotions.component.html',
    styleUrls: ['./emotions.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EmotionsComponent implements OnInit, OnDestroy {
  selectedEmotion: string | null = null;
  selectedEmotionData: EmotionItem | null = null;
  showingVerses = false;
  loadingVerses = false;
  verseTextSize = 16;
  versePageIndex = 1;
  readonly versePageSize = 4;

  private destroy$ = new Subject<void>();
  private allLoadedVerseResults: Array<{ reference: string; version: string; text: string }> = [];
  currentGuidance = '';

  private readonly guidanceByEmotion: Record<string, string> = {
    Anger:
      'In anger, ask God for self-control before response. Let His wisdom slow your words and lead you toward peace, not reaction.',
    Lust: 'In lust, bring your thoughts into the light. Ask God for purity, strong boundaries, and a heart that honors others.',
    'Leadership Pressure':
      'Under leadership pressure, ask God for courage and clarity. Lead as a servant, not from fear, and trust Him with the weight you carry.',
    'Fatherhood Stress':
      'In fatherhood stress, ask for patience and steady love. God can shape your presence, words, and leadership at home.',
    Identity:
      'When identity feels unclear, return to who God says you are. Let Scripture define your strength, purpose, and character.',
    Anxiety:
      'In anxiety, name your worries before God and release them. Ask for peace, clarity, and trust for what you cannot control.',
    Depression:
      'In depression, take one faithful step at a time. Ask God for daily strength, honest community, and light in the dark places.',
    'Shame & Guilt':
      "In shame and guilt, receive Christ's forgiveness and walk in truth. God restores what sin and regret have tried to define.",
    Addiction:
      'In addiction, pursue freedom with honesty and accountability. Ask God for strength to break cycles and build new habits.',
    'Financial Stress':
      'In financial stress, seek wisdom, discipline, and contentment. Ask God to provide and guide your decisions with integrity.',
    'Fear of Failure':
      'When fear of failure rises, anchor your identity in faithfulness, not performance. Ask God for courage to move forward.',
    'Work Burnout':
      'In burnout, ask God to reset your pace and priorities. Receive His rest and work from strength, not exhaustion.',
    Loneliness:
      'In loneliness, ask God to draw you into meaningful brotherhood. Seek connection, not isolation, and invite trusted men in.',
    'Grief & Loss':
      'In grief and loss, bring your sorrow honestly to God. Ask for comfort, endurance, and hope for each new day.',
    'Spiritual Doubt':
      'In spiritual doubt, bring your questions to God openly. Ask for understanding, deeper trust, and a steady faith.',
    'Marriage Conflict':
      'In marriage conflict, ask God for humility, listening, and gentle speech. Pursue unity through truth, grace, and repentance.',
    'Control & Pride':
      'In control and pride, surrender outcomes to God. Ask for humility and the courage to be corrected and led.',
    Temptation:
      'In temptation, watch and pray before you drift. Ask God for a way out, clear boundaries, and Spirit-led discipline.',
    'People Pleasing':
      'In people pleasing, choose faithfulness over approval. Ask God for conviction, clear boundaries, and courage to stand firm.',
    'Purpose & Direction':
      'When purpose feels unclear, ask God for wisdom for your next faithful step. Trust Him to reveal direction over time.',
    Impatience:
      'In impatience, ask God to slow your heart and steady your words. Let His timing form patience and gentleness in you.',
  };
  private readonly sublineByEmotion: Record<string, string> = {
    Anger: 'Strength under control.',
    Lust: 'Purity over impulse.',
    Anxiety: 'Peace over panic.',
    Depression: 'Hope in the valley.',
    'Shame & Guilt': 'Mercy over condemnation.',
    'Leadership Pressure': 'Steady under weight.',
    'Fatherhood Stress': 'Lead with steady love.',
    Identity: 'Rooted in Christ.',
    Addiction: 'Freedom by truth and discipline.',
    'Financial Stress': 'Wisdom over worry.',
    'Fear of Failure': 'Faith over fear.',
    'Work Burnout': 'Rest before rebuilding.',
    Loneliness: 'Brotherhood over isolation.',
    'Grief & Loss': 'Comfort in sorrow.',
    'Spiritual Doubt': 'Questions held by grace.',
    'Marriage Conflict': 'Truth with grace.',
    'Control & Pride': 'Surrender builds strength.',
    Temptation: 'Watchful and anchored.',
    'People Pleasing': 'Conviction over approval.',
    'Purpose & Direction': 'Clarity in faithful steps.',
    Impatience: 'Steady in His timing.'
  };

  emotions: EmotionItem[] = EMOTIONS.map((emotion) => ({ ...emotion, relevantVerses: [] }));

  constructor(
    private bibleApiService: BibleService,
    private navSvc: NavigationService,
    private textSizeService: TextSizeService,
    private bibleVersions: BibleVersionService
  ) {}

  ngOnInit(): void {
    this.verseTextSize = this.textSizeService.getVerseTextSize();
    // Reset view when header triggers a reset (e.g., home/title click)
    this.navSvc.reset$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.deselectEmotion();
    });

    this.bibleVersions.selectedVersion$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.showingVerses || !this.selectedEmotionData || this.allLoadedVerseResults.length === 0) return;
        this.loadAllVersesForEmotion();
      });
  }

  onVerseTextSizeChange(size: number): void {
    this.verseTextSize = size;
    this.textSizeService.setVerseTextSize(size);
  }

  private normalizeEmotionKey(emotion: string): string {
    return emotion
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getEmotionSubline(emotion: string): string {
    const normalized = this.normalizeEmotionKey(emotion);
    const match = Object.keys(this.sublineByEmotion).find(
      (key) => this.normalizeEmotionKey(key) === normalized
    );
    return (match ? this.sublineByEmotion[match] : null) || 'Strength shaped by truth.';
  }

  selectEmotion(emotion: string) {
    this.selectedEmotion = emotion;
    this.selectedEmotionData =
      this.emotions.find((e) => e.emotion === emotion) || null;
    this.currentGuidance =
      this.guidanceByEmotion[emotion] ||
      'Ask God for wisdom, strength, and obedience in this moment. Let His Word guide your next step.';
    this.showingVerses = false;
    this.allLoadedVerseResults = [];
    this.versePageIndex = 1;
    this.navSvc.setBackVisible(true);
  }

  deselectEmotion() {
    this.selectedEmotion = null;
    this.selectedEmotionData = null;
    this.currentGuidance = '';
    this.showingVerses = false;
    this.allLoadedVerseResults = [];
    this.versePageIndex = 1;
    this.navSvc.setBackVisible(false);
  }

  findRelevantVerses() {
    if (!this.selectedEmotionData) return;
    this.versePageIndex = 1;
    if (this.allLoadedVerseResults.length === this.selectedEmotionData.keywordVerses.length) {
      this.showingVerses = true;
      this.updateVisibleVersePage();
      return;
    }
    this.loadAllVersesForEmotion();
  }

  onVersePageChange(page: number): void {
    if (!this.selectedEmotionData) return;
    this.versePageIndex = page;
    this.updateVisibleVersePage();
  }

  get totalVerseCount(): number {
    return this.selectedEmotionData?.keywordVerses.length || 0;
  }

  private updateVisibleVersePage(): void {
    if (!this.selectedEmotionData) return;
    const start = (this.versePageIndex - 1) * this.versePageSize;
    this.selectedEmotionData.relevantVerses = this.allLoadedVerseResults.slice(start, start + this.versePageSize);
  }

  private loadAllVersesForEmotion() {
    if (!this.selectedEmotionData) return;
    this.loadingVerses = true;
    this.showingVerses = true;
    const refs = this.selectedEmotionData.keywordVerses;

    from(refs)
      .pipe(
        concatMap((ref) =>
          this.bibleApiService.getPassage(ref).pipe(
            map((r) => ({
              ref: r.reference || ref,
              version: r.translation_name || r.translation_id || '',
              text: this.bibleApiService.formatPassageQuote(r)
            })),
            catchError(() => of({ ref, version: '', text: 'Unable to load verse text.' })),
          ),
        ),
        toArray(),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (results) => {
          this.allLoadedVerseResults = results.map((r) => ({
            reference: r.ref,
            version: r.version,
            text: r.text,
          }));
          this.updateVisibleVersePage();
          this.loadingVerses = false;
        },
        error: () => {
          this.allLoadedVerseResults = refs.map((s) => ({
            reference: s,
            version: '',
            text: 'Unable to load verse text.',
          }));
          this.updateVisibleVersePage();
          this.loadingVerses = false;
        },
      });
  }

  backToProblems() {
    this.showingVerses = false;
    this.allLoadedVerseResults = [];
    this.versePageIndex = 1;
    if (this.selectedEmotionData) this.selectedEmotionData.relevantVerses = [];
  }

  goToEmotionDetailsFromBreadcrumb(): void {
    if (!this.selectedEmotion || !this.showingVerses) return;
    this.backToProblems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
