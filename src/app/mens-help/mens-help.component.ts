import { Component, OnDestroy, OnInit } from '@angular/core';
import { BibleService } from '../services/bible.service';
import { NavigationService } from '../services/navigation.service';
import { TextSizeService } from '../services/text-size.service';
import { BibleVersionService } from '../services/bible-version.service';
import { from, of, Subject } from 'rxjs';
import { concatMap, toArray, map, catchError, takeUntil, distinctUntilChanged } from 'rxjs/operators';

interface MensHelp {
  emotion: string;
  description?: string;
  problems: string[];
  icon: string;
  keywordVerses: string[];
  relevantVerses: Array<{ reference: string; version: string; text: string }>;
}

@Component({
  selector: 'app-mens-help',
  templateUrl: './mens-help.component.html',
  styleUrls: ['./mens-help.component.scss'],
})
export class MensHelpComponent implements OnInit, OnDestroy {
  selectedEmotion: string | null = null;
  selectedEmotionData: MensHelp | null = null;
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

  emotions: MensHelp[] = [
    {
      emotion: 'Anger',
      description:
        'Anger in men often masks hurt, disrespect, or loss of control. Scripture teaches that strength is not explosive reaction but disciplined restraint. God calls men to righteous anger without sin, leading with patience, humility, and wisdom.',
      icon: 'fire',
      problems: [
        'Short temper',
        'Feeling disrespected',
        'Road rage',
        'Explosive reactions',
        'Holding grudges',
      ],
      keywordVerses: [
        'Ephesians 4:26-27',
        'James 1:19-20',
        'Proverbs 16:32',
        'Proverbs 14:29',
        'Ecclesiastes 7:9',
        'Psalm 37:8',
        'Proverbs 15:1',
        'Colossians 3:8',
        'Matthew 5:22',
        'Romans 12:19',
        'Proverbs 19:11',
        'Galatians 5:22-23',
        'Proverbs 29:11',
        'Psalm 4:4',
        '1 Peter 2:23',
        'Proverbs 20:3',
        'Matthew 5:9',
        'Romans 12:21',
        'Proverbs 22:24-25',
        'Colossians 3:12-13',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Lust',
      description:
        'Men are bombarded daily with sexual imagery and temptation. Scripture calls men to self-control, honor, and purity of heart. Real strength is mastering desire, not being mastered by it.',
      icon: 'eye-invisible',
      problems: [
        'Pornography',
        'Lustful thoughts',
        'Objectifying women',
        'Secret habits',
        'Sexual shame',
      ],
      keywordVerses: [
        'Matthew 5:28',
        '1 Thessalonians 4:3-5',
        'Job 31:1',
        '1 Corinthians 6:18-20',
        'Proverbs 4:23',
        '2 Timothy 2:22',
        'Psalm 119:9-11',
        'James 1:14-15',
        'Galatians 5:16',
        'Colossians 3:5',
        'Romans 13:14',
        'Hebrews 13:4',
        'Psalm 51:10',
        'Titus 2:11-12',
        'Proverbs 6:25',
        '1 Corinthians 10:13',
        '2 Corinthians 10:5',
        'Ephesians 5:3',
        '1 Peter 2:11',
        'Galatians 5:22-23',
      ],
      relevantVerses: [],
    },
    {
      emotion: 'Anxiety',
      description:
        'Anxiety in men often hides beneath responsibility and silent pressure. Scripture calls men to cast their burdens on the Lord, trusting that God carries what they cannot control.',
      icon: 'exclamation-circle',
      problems: [
        'Financial pressure',
        'Health worries',
        'Future uncertainty',
        'Work stress',
        'Family concerns',
      ],
      keywordVerses: [
        'Philippians 4:6-7',
        '1 Peter 5:7',
        'Matthew 6:25-34',
        'Isaiah 41:10',
        'Psalm 56:3',
        'John 14:27',
        'Joshua 1:9',
        'Romans 8:15',
        'Psalm 94:19',
        'Isaiah 26:3',
        'Psalm 23:4',
        'Psalm 27:1',
        '2 Timothy 1:7',
        'Psalm 46:1',
        'Proverbs 3:5-6',
        'Psalm 34:4',
        'John 16:33',
        'Romans 15:13',
        'Psalm 121:1-2',
        'Hebrews 13:6',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Depression',
      description:
        'Depression is not weakness. Even strong men in Scripture wrestled with despair. God meets men in the dark and restores strength one day at a time.',
      icon: 'frown',
      problems: [
        'Loss of motivation',
        'Emotional numbness',
        'Isolation',
        'Persistent sadness',
        'Loss of joy',
      ],
      keywordVerses: [
        'Psalm 42:11',
        'Psalm 34:18',
        'Lamentations 3:22-23',
        'Isaiah 40:29-31',
        '2 Corinthians 4:8-9',
        'Romans 8:38-39',
        'Psalm 147:3',
        'John 16:33',
        'Psalm 30:5',
        'Micah 7:8',
        '2 Corinthians 1:3-4',
        'Psalm 40:1-3',
        'Isaiah 57:15',
        'Matthew 11:28-30',
        'Psalm 6:6-9',
        'Psalm 13:1-2',
        'Psalm 73:26',
        'Romans 15:13',
        'Zephaniah 3:17',
        'Hebrews 6:19',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Forgiveness',
      description:
        'Forgiveness can feel impossible when the wound runs deep. Many wrestle with bitterness, anger, and the desire for justice. Scripture calls us to forgive as we have been forgiven, releasing others into God’s hands.',
      icon: 'unlock',
      problems: [
        'Letting go of resentment',
        'Replaying past hurt',
        'Desire for revenge',
        'Struggling to trust again',
        'Forgiving yourself',
      ],
      keywordVerses: [
        'Ephesians 4:31-32',
        'Colossians 3:13',
        'Matthew 6:14-15',
        'Matthew 18:21-22',
        'Luke 6:37',
        'Mark 11:25',
        'Romans 12:17-21',
        'Hebrews 12:14-15',
        'Psalm 103:10-12',
        'Isaiah 1:18',
        '1 John 1:9',
        'James 2:13',
        'Proverbs 17:9',
        'Luke 23:34',
        'Genesis 50:20',
        'Micah 7:18-19',
        'Psalm 32:1-5',
        '2 Corinthians 5:17-18',
        'Matthew 5:7',
        '1 Peter 4:8',
      ],
      relevantVerses: [],
    },
    {
      emotion: 'Leadership Pressure',
      description:
        'Men often feel the weight of leading a family, team, or ministry. Leadership can feel isolating and heavy. Scripture reminds men that leadership is servanthood, courage, and dependence on God.',
      icon: 'compass',
      problems: [
        'Pressure to provide',
        'Decision fatigue',
        'Fear of failing others',
        'Carrying responsibility alone',
        'Work-family tension',
      ],
      keywordVerses: [
        'Joshua 1:9',
        '1 Corinthians 16:13',
        'Luke 12:48',
        'James 3:1',
        'Matthew 20:26',
        'Mark 10:45',
        'Psalm 78:72',
        'Nehemiah 2:18',
        'Proverbs 11:14',
        'Exodus 18:21',
        '1 Peter 5:2-3',
        '2 Timothy 2:2',
        'Titus 1:7',
        'Hebrews 13:7',
        'Proverbs 27:23',
        'Philippians 2:4',
        'Colossians 4:17',
        '1 Timothy 3:1',
        'Proverbs 16:9',
        'Ecclesiastes 4:9-10',
      ],
      relevantVerses: [],
    },
    {
      emotion: 'Fatherhood Stress',
      description:
        'Fatherhood brings joy and deep responsibility. Many men wrestle with guilt, fear, and inadequacy as dads. Scripture calls fathers to lead with love, patience, and consistent presence.',
      icon: 'user',
      problems: [
        'Fear of failing your kids',
        'Discipline tension',
        'Not feeling respected',
        'Balancing work and family',
        'Regret over parenting mistakes',
      ],
      keywordVerses: [
        'Ephesians 6:4',
        'Proverbs 22:6',
        'Psalm 127:3-5',
        'Colossians 3:21',
        'Deuteronomy 6:6-7',
        'Joshua 24:15',
        'Psalm 103:13',
        'Proverbs 20:7',
        'Hebrews 12:11',
        'James 1:5',
        '1 Corinthians 13:4-7',
        'Micah 6:8',
        'Proverbs 3:5-6',
        'Psalm 78:4',
        'Proverbs 13:24',
        'Psalm 112:1-2',
        'Malachi 4:6',
        'Luke 11:11-13',
        '2 Timothy 1:5',
        'Proverbs 4:1-4',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Identity',
      description:
        'Many men struggle with what it truly means to be a man. Culture sends mixed signals. Scripture roots identity in being made in God’s image — strong, humble, self-controlled, and sacrificial.',
      icon: 'star',
      problems: [
        'Feeling inadequate',
        'Comparing yourself to other men',
        'Questioning masculinity',
        'Low confidence',
        'Confusion about role',
      ],
      keywordVerses: [
        'Genesis 1:27',
        '1 Corinthians 16:13',
        'Micah 6:8',
        'Ephesians 2:10',
        '2 Corinthians 5:17',
        '1 Peter 2:9',
        'Romans 8:15',
        'Psalm 139:14',
        'Colossians 3:3',
        'Galatians 2:20',
        'Proverbs 27:17',
        'Joshua 1:9',
        'Philippians 4:13',
        '1 John 3:1',
        'Romans 12:2',
        'Jeremiah 1:5',
        'Isaiah 43:1',
        'Hebrews 10:14',
        '1 Corinthians 6:11',
        'Psalm 100:3',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Shame & Guilt',
      description:
        'Many men carry private regret. Scripture declares forgiveness, cleansing, and new identity in Christ for those who repent.',
      icon: 'close-circle',
      problems: [
        'Past mistakes',
        'Sexual shame',
        'Hidden regret',
        'Fear of exposure',
        'Feeling unworthy',
      ],
      keywordVerses: [
        'Romans 8:1',
        '1 John 1:9',
        'Psalm 32:1-5',
        'Psalm 103:12',
        'Isaiah 1:18',
        'Micah 7:19',
        'Hebrews 8:12',
        'Colossians 2:13-14',
        '2 Corinthians 5:17',
        'Acts 3:19',
        'Psalm 51:10',
        'Ephesians 1:7',
        'Titus 3:5',
        'Hebrews 4:16',
        'Psalm 130:3-4',
        'Isaiah 43:25',
        'Romans 5:1',
        'John 8:11',
        'Hebrews 10:17',
        'Psalm 86:5',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Addiction',
      description:
        'Addiction enslaves desire and isolates men in secrecy. Scripture promises freedom, accountability, and power through the Spirit.',
      icon: 'lock',
      problems: [
        'Porn addiction',
        'Alcohol dependence',
        'Substance abuse',
        'Compulsive behavior',
        'Escapism',
      ],
      keywordVerses: [
        'John 8:36',
        '1 Corinthians 10:13',
        'Romans 6:14',
        'Galatians 5:1',
        'Romans 8:1',
        'Galatians 5:16',
        '1 Corinthians 6:12',
        'James 5:16',
        '2 Timothy 2:22',
        'Titus 2:11-12',
        'Psalm 107:13-14',
        'Romans 6:6',
        'Colossians 3:5',
        'Ephesians 5:18',
        'Hebrews 12:1',
        'Psalm 119:9',
        '2 Corinthians 5:17',
        '1 Peter 5:8',
        'Proverbs 28:13',
        'Galatians 5:22-23',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Financial Stress',
      description:
        'Men often feel deep pressure to provide. Scripture calls for faithful stewardship, contentment, and trust in God as provider.',
      icon: 'wallet',
      problems: [
        'Debt',
        'Job instability',
        'Providing for family',
        'Fear of poverty',
        'Overspending',
      ],
      keywordVerses: [
        'Matthew 6:31-33',
        'Philippians 4:19',
        'Proverbs 22:7',
        'Hebrews 13:5',
        '1 Timothy 6:6-10',
        'Luke 16:10',
        'Proverbs 3:9-10',
        'Psalm 37:25',
        'Deuteronomy 8:18',
        'Proverbs 21:5',
        'Ecclesiastes 5:10',
        'Acts 20:35',
        'Proverbs 10:22',
        '2 Corinthians 9:6-8',
        'Luke 12:15',
        'Malachi 3:10',
        'Psalm 112:5',
        'Proverbs 22:1',
        'Matthew 6:19-21',
        'Colossians 3:23',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Fear of Failure',
      description:
        'Many men quietly fear not measuring up. Scripture reminds men that identity is not performance but faithfulness.',
      icon: 'warning',
      problems: [
        'Career fear',
        'Fear of letting family down',
        'Comparison',
        'Risk avoidance',
        'Performance pressure',
      ],
      keywordVerses: [
        'Isaiah 41:10',
        '2 Timothy 1:7',
        'Romans 8:31',
        'Joshua 1:9',
        'Psalm 118:6',
        'Proverbs 29:25',
        'Philippians 4:13',
        '1 Corinthians 15:58',
        'James 1:12',
        '2 Corinthians 12:9',
        'Mark 5:36',
        '1 John 4:18',
        'Psalm 27:1',
        'Romans 15:13',
        'Isaiah 40:31',
        'Hebrews 13:6',
        'Micah 7:8',
        'Psalm 56:3',
        'Deuteronomy 31:6',
        'John 14:27',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Work Burnout',
      description:
        'Men often tie worth to productivity. Scripture commands rest, Sabbath rhythm, and reliance on God over endless striving.',
      icon: 'exclamation',
      problems: [
        'Overworking',
        'Exhaustion',
        'Irritability',
        'Neglecting family',
        'Loss of joy',
      ],
      keywordVerses: [
        'Matthew 11:28',
        'Psalm 127:2',
        'Mark 6:31',
        'Isaiah 40:29',
        'Ecclesiastes 4:6',
        'Hebrews 4:9-10',
        'Psalm 46:10',
        'Colossians 3:23',
        'Proverbs 16:3',
        'Jeremiah 31:25',
        'Isaiah 26:3',
        'Philippians 4:6-7',
        'Psalm 23:2-3',
        'Exodus 33:14',
        'Romans 8:28',
        'Galatians 6:9',
        'James 1:5',
        'Psalm 90:17',
        '1 Corinthians 10:31',
        '2 Thessalonians 3:13',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Loneliness',
      description:
        'Men often suffer in silence, believing they must handle everything alone. Scripture calls men into brotherhood and reminds them they are never abandoned.',
      icon: 'eye',
      problems: [
        'Isolation',
        'No close friendships',
        'Emotional withdrawal',
        'Lack of accountability',
        'Feeling unseen',
      ],
      keywordVerses: [
        'Genesis 2:18',
        'Ecclesiastes 4:9-10',
        'Proverbs 27:17',
        'Hebrews 10:24-25',
        'Psalm 68:6',
        'John 15:15',
        'Romans 12:10',
        '1 Samuel 18:1',
        'Colossians 3:14',
        'Proverbs 18:24',
        'Isaiah 41:10',
        'Matthew 28:20',
        'Psalm 25:16',
        '2 Timothy 4:16-17',
        'John 14:18',
        'Acts 2:44',
        'Philippians 1:3-5',
        '1 Peter 4:8',
        'Psalm 23:4',
        '3 John 1:2',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Grief & Loss',
      description:
        'Men are often taught not to cry. Scripture shows that grief is human and that hope exists beyond loss.',
      icon: 'heart',
      problems: [
        'Loss of loved one',
        'Divorce',
        'Job loss',
        'Lost dreams',
        'Emotional shutdown',
      ],
      keywordVerses: [
        'Psalm 34:18',
        'Psalm 147:3',
        'Matthew 5:4',
        'John 11:25-26',
        'Revelation 21:4',
        'Romans 8:18',
        '2 Corinthians 1:3-4',
        'Isaiah 61:3',
        'Psalm 30:5',
        'Lamentations 3:22-23',
        'Psalm 23:4',
        'Romans 8:38-39',
        'Hebrews 6:19',
        '1 Thessalonians 4:13-14',
        'Psalm 126:5',
        '2 Corinthians 4:16-18',
        'Isaiah 25:8',
        'Ecclesiastes 3:1-4',
        '1 Peter 5:10',
        'Psalm 116:15',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Spiritual Doubt',
      description:
        'Men wrestle with questions about God, suffering, and faith. Scripture welcomes honest doubt and strengthens belief.',
      icon: 'question-circle',
      problems: [
        'Questioning faith',
        'Feeling distant from God',
        'Struggling to trust',
        'Intellectual doubts',
        'Spiritual dryness',
      ],
      keywordVerses: [
        'Mark 9:24',
        'James 1:5',
        'Hebrews 11:1',
        'Romans 10:17',
        'Jeremiah 33:3',
        'Matthew 14:31',
        'John 20:29',
        '2 Corinthians 5:7',
        '1 Peter 1:7',
        'Psalm 73:21-26',
        'Isaiah 55:8-9',
        'Lamentations 3:25',
        'Jude 1:22',
        'Luke 24:38',
        '1 Corinthians 13:12',
        'Romans 8:28',
        'Hebrews 4:16',
        'Psalm 119:105',
        'Psalm 42:5',
        'Proverbs 3:5-6',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Marriage Conflict',
      description:
        'Marriage can bring deep joy and deep tension. Scripture calls husbands to sacrificial love, patience, humility, and peace-making.',
      icon: 'shake',
      problems: [
        'Communication breakdown',
        'Frequent arguments',
        'Emotional distance',
        'Unforgiveness',
        'Trust strain',
      ],
      keywordVerses: [
        'Ephesians 5:25',
        'Colossians 3:19',
        '1 Peter 3:7',
        'James 1:19',
        'Proverbs 15:1',
        'Ephesians 4:2-3',
        'Romans 12:18',
        'Colossians 3:13',
        '1 Corinthians 13:4-7',
        'Proverbs 18:13',
        'Matthew 7:5',
        'Ecclesiastes 4:12',
        'Amos 3:3',
        'Philippians 2:3-4',
        'Ephesians 4:26',
        'Mark 10:9',
        'Proverbs 3:5-6',
        'Psalm 127:1',
        'Romans 15:5',
        'Hebrews 12:14',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Control & Pride',
      description:
        'Many men feel safest when in control. Scripture teaches that true strength is surrender, humility, and trust in God over self-rule.',
      icon: 'crown',
      problems: [
        'Need to control outcomes',
        'Difficulty admitting wrong',
        'Stubbornness',
        'Impatience with others',
        'Resistance to correction',
      ],
      keywordVerses: [
        'Proverbs 3:5-6',
        'James 4:6',
        '1 Peter 5:5-6',
        'Proverbs 16:18',
        'Philippians 2:3',
        'Micah 6:8',
        'Romans 12:3',
        'Proverbs 11:2',
        'Luke 22:42',
        'Matthew 23:12',
        'Psalm 131:1-2',
        'Proverbs 15:33',
        'Isaiah 66:2',
        'Galatians 5:22-23',
        'Ephesians 4:2',
        'James 4:10',
        'Colossians 3:12',
        'Romans 8:6',
        'Psalm 37:5',
        'Proverbs 19:21',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Temptation',
      description:
        'Temptation often hits men through isolation, stress, and unchecked thought patterns. Scripture points to vigilance, accountability, and Spirit-led self-control.',
      icon: 'alert',
      problems: [
        'Compromising convictions',
        'Secret thought life',
        'Weak boundaries',
        'Repeated sin cycles',
        'Giving in under pressure',
      ],
      keywordVerses: [
        '1 Corinthians 10:13',
        'James 1:14-15',
        'Matthew 26:41',
        'Galatians 5:16',
        'Romans 13:14',
        '2 Timothy 2:22',
        'Psalm 119:11',
        'Hebrews 4:15-16',
        'Ephesians 6:11',
        '1 Peter 5:8-9',
        'Proverbs 4:23',
        'Colossians 3:5',
        'Job 31:1',
        'Titus 2:11-12',
        'Galatians 6:1',
        'Ecclesiastes 4:9-10',
        'James 5:16',
        'Psalm 141:4',
        'Romans 6:12-14',
        'Jude 1:24',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'People Pleasing',
      description:
        'Men can become driven by approval, fear of conflict, or fear of rejection. Scripture calls men to fear God above man and walk with integrity.',
      icon: 'team',
      problems: [
        'Fear of disappointing others',
        'Avoiding hard conversations',
        'Lack of boundaries',
        'Compromising convictions',
        'Approval addiction',
      ],
      keywordVerses: [
        'Galatians 1:10',
        'Proverbs 29:25',
        'Colossians 3:23',
        'Ephesians 6:6',
        '1 Thessalonians 2:4',
        'Acts 5:29',
        'Romans 12:2',
        '2 Timothy 1:7',
        'Psalm 118:6',
        'Matthew 5:37',
        'James 1:8',
        'Proverbs 4:25-27',
        'Micah 6:8',
        'John 12:43',
        '1 Corinthians 16:13',
        'Isaiah 41:10',
        'Hebrews 13:6',
        'Romans 14:12',
        'Matthew 22:37',
        'Joshua 24:15',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Purpose & Direction',
      description:
        'Many men feel stuck between responsibility and calling. Scripture reminds men that God gives wisdom, direction, and purpose for faithful steps.',
      icon: 'aim',
      problems: [
        'Feeling stuck',
        'Lack of direction',
        'Confusion about calling',
        'Comparison with others',
        'Wasted potential anxiety',
      ],
      keywordVerses: [
        'Jeremiah 29:11',
        'Proverbs 3:5-6',
        'Psalm 32:8',
        'Ephesians 2:10',
        'Colossians 3:17',
        'James 1:5',
        'Romans 12:2',
        'Isaiah 30:21',
        'Psalm 119:105',
        'Philippians 1:6',
        'Proverbs 16:9',
        'Ecclesiastes 3:1',
        'Galatians 6:9',
        '2 Timothy 1:9',
        '1 Corinthians 15:58',
        'Matthew 6:33',
        'Psalm 37:23',
        'Hebrews 12:1-2',
        'John 15:5',
        'Romans 8:28',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Impatience',
      description:
        "Impatience can show up as irritability, harsh speech, and frustration with delays. Scripture forms men through patience, gentleness, and trust in God's timing.",
      icon: 'clock-circle',
      problems: [
        'Quick frustration',
        'Short fuse in conversations',
        'Rushing decisions',
        'Discontent with slow progress',
        'Harsh tone with family',
      ],
      keywordVerses: [
        'James 1:19-20',
        'Galatians 5:22-23',
        'Ecclesiastes 7:8',
        'Proverbs 14:29',
        'Psalm 27:14',
        'Romans 12:12',
        'Colossians 3:12',
        'Ephesians 4:2',
        'Proverbs 15:18',
        'Psalm 37:7',
        'Isaiah 40:31',
        'Lamentations 3:25-26',
        '2 Peter 3:9',
        'Micah 7:7',
        'Hebrews 6:12',
        'Proverbs 16:32',
        'Romans 8:25',
        'James 5:7-8',
        'Psalm 130:5',
        'Philippians 4:5',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Resentment',
      description:
        'Resentment grows when hurt is replayed and grace is withheld. Scripture calls men to release bitterness, forgive, and pursue peace.',
      icon: 'stop',
      problems: [
        'Holding grudges',
        'Replaying past offenses',
        'Cold distance in relationships',
        'Harsh assumptions',
        'Unresolved conflict',
      ],
      keywordVerses: [
        'Ephesians 4:31-32',
        'Colossians 3:13',
        'Hebrews 12:15',
        'Matthew 6:14-15',
        'Romans 12:18',
        'Proverbs 19:11',
        '1 Peter 3:9',
        'James 1:20',
        'Romans 12:21',
        'Psalm 103:12',
        'Micah 7:18-19',
        'Proverbs 15:1',
        'Ephesians 4:26',
        'Matthew 5:23-24',
        'Luke 6:27-28',
        '1 Corinthians 13:5',
        'Galatians 5:22-23',
        'Romans 14:19',
        'Psalm 34:14',
        '2 Corinthians 5:18',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Discouragement',
      description:
        'Discouragement makes progress feel pointless and heavy. Scripture strengthens men to endure, hope, and keep doing good.',
      icon: 'meh',
      problems: [
        'Loss of momentum',
        'Feeling defeated',
        'Negative self-talk',
        'Giving up quickly',
        'Hopeless outlook',
      ],
      keywordVerses: [
        'Galatians 6:9',
        'Joshua 1:9',
        'Isaiah 41:10',
        'Psalm 42:11',
        'Romans 15:13',
        '2 Corinthians 4:16',
        'Hebrews 10:35-36',
        'Philippians 4:13',
        'Psalm 27:14',
        '2 Thessalonians 3:13',
        'Isaiah 40:31',
        'Nehemiah 8:10',
        'Psalm 31:24',
        'Romans 8:28',
        'John 16:33',
        '1 Corinthians 15:58',
        'Hebrews 12:3',
        'Psalm 46:1',
        '2 Timothy 1:7',
        'Lamentations 3:22-23',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Comparison',
      description:
        'Comparison robs gratitude and peace. Scripture calls men to faithfulness in their own race instead of measuring against others.',
      icon: 'bar-chart',
      problems: [
        'Jealousy',
        'Feeling behind in life',
        "Envy of others' success",
        'Insecurity',
        'Constant self-measurement',
      ],
      keywordVerses: [
        'Galatians 6:4-5',
        '2 Corinthians 10:12',
        'Proverbs 14:30',
        'James 3:16',
        'Philippians 2:3-4',
        'Romans 12:3',
        'Hebrews 12:1-2',
        'Psalm 139:14',
        '1 Corinthians 12:18',
        'John 21:22',
        'Ecclesiastes 4:4',
        'Romans 12:15',
        '1 Thessalonians 5:18',
        'Proverbs 23:17',
        'Psalm 73:2-3',
        'Galatians 1:10',
        'Colossians 3:2',
        'Ephesians 2:10',
        'Philippians 4:11-12',
        'James 1:17',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Anger at God',
      description:
        "Men can feel betrayed or confused by suffering and unanswered prayers. Scripture invites honest lament and renewed trust in God's character.",
      icon: 'cloud',
      problems: [
        'Frustration with unanswered prayer',
        "Questioning God's goodness",
        'Bitterness from pain',
        'Distance from prayer',
        'Spiritual confusion',
      ],
      keywordVerses: [
        'Psalm 13:1-2',
        'Psalm 22:1-2',
        'Habakkuk 1:2-3',
        'Job 13:15',
        'Psalm 62:8',
        'Romans 8:28',
        'Isaiah 55:8-9',
        'Proverbs 3:5-6',
        'Psalm 34:18',
        'Lamentations 3:31-33',
        'Mark 9:24',
        'Psalm 77:7-9',
        'John 16:33',
        '1 Peter 5:7',
        'Hebrews 4:16',
        'Romans 8:38-39',
        'Psalm 73:26',
        '2 Corinthians 1:3-4',
        'James 1:5',
        'Jeremiah 29:13',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Shame from Past',
      description:
        'Past choices can keep men trapped in self-condemnation. Scripture points to confession, cleansing, and a restored identity in Christ.',
      icon: 'safety-certificate',
      problems: [
        'Haunted by old decisions',
        'Fear of being exposed',
        'Feeling disqualified',
        'Difficulty receiving grace',
        'Withdrawing from community',
      ],
      keywordVerses: [
        'Romans 8:1',
        '1 John 1:9',
        '2 Corinthians 5:17',
        'Psalm 103:12',
        'Hebrews 10:22',
        'Isaiah 43:25',
        'Colossians 2:13-14',
        'Titus 3:5',
        'Psalm 51:10',
        'Hebrews 4:16',
        'Micah 7:19',
        'Acts 3:19',
        'Ephesians 1:7',
        'John 8:36',
        'Philippians 3:13-14',
        'Hebrews 8:12',
        'Psalm 32:5',
        'Isaiah 1:18',
        'Romans 5:1',
        '1 Peter 2:24',
      ],
      relevantVerses: [],
    },

    {
      emotion: 'Decision Fatigue',
      description:
        'Constant decisions can exhaust men mentally and spiritually. Scripture offers wisdom, clarity, and peace for daily choices.',
      icon: 'cluster',
      problems: [
        'Mental overload',
        'Second-guessing decisions',
        'Paralysis from options',
        'Fear of choosing wrong',
        'Stress from responsibility',
      ],
      keywordVerses: [
        'James 1:5',
        'Proverbs 3:5-6',
        'Isaiah 30:21',
        'Psalm 32:8',
        'Proverbs 16:9',
        'Philippians 4:6-7',
        'Colossians 3:15',
        'Romans 12:2',
        'Psalm 119:105',
        'Proverbs 11:14',
        'Psalm 37:5',
        'Isaiah 26:3',
        'Ecclesiastes 3:1',
        'John 14:27',
        'Proverbs 15:22',
        'Matthew 6:33',
        'Psalm 25:4-5',
        'Hebrews 13:8',
        'Jeremiah 33:3',
        'Romans 8:14',
      ],
      relevantVerses: [],
    },
  ];

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
        error: (err) => {
          console.error(err);
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
