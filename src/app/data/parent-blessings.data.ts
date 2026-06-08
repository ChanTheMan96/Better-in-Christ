import { MensHelp } from '../models/mens-help.model';

export interface ParentBlessingCategory extends MensHelp {
  blessing: string;
}

export const PARENT_BLESSINGS: ParentBlessingCategory[] = [
  {
    emotion: 'New Baby',
    description:
      'A newborn child is not merely an addition to a family, but a divine trust. Scripture calls children a gift from the Lord and reminds parents that every life is known, formed, and purposed by God. This blessing focuses on protection, identity, growth, and a lifelong foundation of faith from the very beginning.',
    icon: 'heart',
    problems: [
      'Parental fear about safety and health',
      'Need for wisdom in early parenting decisions',
      'Establishing a peaceful and stable home',
      'Forming spiritual foundations from infancy',
      'Trusting God while carrying new responsibilities'
    ],
    blessing:
      'Father,\n\nThank You for this child, fearfully and wonderfully made.\nGuard their body, shape their heart, and anchor their life in truth.\nSurround them with protection.\nFill our home with peace and wisdom as we raise them.\nMay they grow in strength, in favor with You, and in love for what is right.\nEstablish their steps from their earliest days.\nIn Jesus’ name, Amen.',
    keywordVerses: [
      'Genesis 1:27',
      'Genesis 17:7',
      'Exodus 2:2',
      'Deuteronomy 6:6-7',
      'Deuteronomy 31:8',
      '1 Samuel 1:27-28',
      'Psalm 22:9-10',
      'Psalm 91:11',
      'Psalm 100:3',
      'Psalm 121:7-8',
      'Psalm 127:3-5',
      'Psalm 139:13-16',
      'Proverbs 3:5-6',
      'Proverbs 22:6',
      'Isaiah 44:2',
      'Isaiah 54:13',
      'Jeremiah 1:5',
      'Matthew 18:10',
      'Mark 10:14-16',
      'Luke 1:15',
      'Luke 2:40',
      'Luke 2:52',
      'Ephesians 3:16-19',
      '2 Timothy 1:5',
      'James 1:17'
    ]
  },
  {
    emotion: 'Identity in Christ',
    description:
      'Children must know who they are before they know what they do. This blessing anchors identity in God’s covenant love, not performance, comparison, or approval from culture.',
    icon: 'user',
    problems: [
      'Basing worth on achievement',
      'Comparing identity with peers',
      'Seeking constant approval',
      'Confusion about belonging',
      'Fear of rejection'
    ],
    blessing:
      'Father, let my child know they are loved, chosen, and secure in You. Guard their heart from lies about worth. Root their identity in Christ, not culture. Establish them in truth from an early age.',
    keywordVerses: [
      'Psalm 127:3',
      'Psalm 139:13-14',
      'Isaiah 43:1',
      'Jeremiah 1:5',
      'Matthew 3:17',
      'John 1:12',
      'Romans 8:15-16',
      'Romans 8:38-39',
      '1 Corinthians 6:19-20',
      'Galatians 4:6-7',
      'Ephesians 1:4-5',
      'Ephesians 2:10',
      'Colossians 3:3',
      '1 John 3:1',
      '1 Peter 2:9',
      'Zephaniah 3:17',
      'Psalm 100:3',
      '2 Corinthians 5:17',
      'Deuteronomy 14:2',
      'Isaiah 49:16'
    ]
  },
  {
    emotion: 'Wisdom & Discernment',
    description:
      'Children need clarity of mind and moral discernment formed by Scripture. This blessing asks God to shape judgment, teachable hearts, and courage to choose what is true and good.',
    icon: 'bulb',
    problems: [
      'Impulsive decisions',
      'Confusion between truth and opinion',
      'Pressure to follow foolish paths',
      'Ignoring counsel',
      'Lack of scriptural reasoning'
    ],
    blessing:
      'Lord, give my child wisdom beyond their years. Teach them to love truth and reject foolishness. Let them discern right from wrong and walk in understanding.',
    keywordVerses: [
      'Proverbs 1:7',
      'Proverbs 2:6',
      'Proverbs 3:5-6',
      'Proverbs 4:7',
      'Proverbs 9:10',
      'Ecclesiastes 7:12',
      'Psalm 119:105',
      'James 1:5',
      'James 3:17',
      'Colossians 1:9-10',
      'Luke 2:52',
      '1 Kings 3:9',
      '2 Timothy 3:15',
      'Psalm 111:10',
      'Hebrews 5:14',
      'Romans 12:2',
      'Ephesians 1:17',
      'Proverbs 14:29',
      'Proverbs 19:20',
      'Micah 6:8'
    ]
  },
  {
    emotion: 'Courage & Strength',
    description:
      'Children will face pressure, fear, and opposition. This blessing asks God for steadfast courage rooted in reverence for Him, so strength is expressed through faithful obedience.',
    icon: 'aim',
    problems: [
      'Fear of people',
      'Compromise under pressure',
      'Silence when truth is needed',
      'Retreating from hard obedience',
      'Anxiety in adversity'
    ],
    blessing:
      'God, make my child brave in righteousness. Strengthen them to stand firm when pressured. Let them fear You more than they fear the world.',
    keywordVerses: [
      'Deuteronomy 31:6',
      'Joshua 1:9',
      'Psalm 27:1',
      'Psalm 31:24',
      'Isaiah 41:10',
      'Isaiah 43:2',
      'Matthew 10:28',
      'Acts 4:29',
      'Romans 8:31',
      '1 Corinthians 16:13',
      'Ephesians 6:10',
      'Philippians 1:28',
      '2 Timothy 1:7',
      'Hebrews 13:6',
      '1 Peter 5:8-9',
      'Proverbs 28:1',
      'Psalm 56:3-4',
      'John 16:33',
      'Revelation 2:10',
      '1 Chronicles 28:20'
    ]
  },
  {
    emotion: 'Purity & Self-Control',
    description:
      'Children need disciplined hearts under Christ’s lordship. This blessing asks God to guard desires, form holy habits, and strengthen resistance to temptation.',
    icon: 'lock',
    problems: [
      'Uncontrolled impulses',
      'Compromise in private habits',
      'Weak boundaries with temptation',
      'Distracted and undisciplined thoughts',
      'Reactive speech and behavior'
    ],
    blessing:
      'Father, guard my child’s mind and body. Teach them self-control. Strengthen them to resist temptation and love holiness.',
    keywordVerses: [
      'Proverbs 4:23',
      'Proverbs 25:28',
      'Psalm 119:9',
      'Matthew 5:8',
      'Romans 6:12-13',
      'Romans 12:1-2',
      '1 Corinthians 6:18-20',
      '1 Corinthians 10:13',
      'Galatians 5:16',
      'Galatians 5:22-23',
      'Ephesians 4:22-24',
      'Philippians 4:8',
      '1 Thessalonians 4:3-4',
      '2 Timothy 2:22',
      'Titus 2:11-12',
      'James 1:14-15',
      '1 Peter 1:15-16',
      '2 Peter 1:5-6',
      'Hebrews 12:11',
      'Psalm 51:10'
    ]
  },
  {
    emotion: 'Compassion & Love',
    description:
      'Children must learn tender strength: truth with mercy, conviction with gentleness, and sacrificial love that serves others. This blessing asks God to form hearts that forgive and care deeply.',
    icon: 'heart',
    problems: [
      'Harsh responses toward others',
      'Holding grudges',
      'Self-centered habits',
      'Lack of empathy',
      'Slowness to forgive'
    ],
    blessing:
      'Lord, make my child quick to forgive and eager to serve. Fill their heart with compassion and patience. Teach them to love as Christ loves.',
    keywordVerses: [
      'John 13:34-35',
      'Romans 12:9-10',
      'Romans 12:17-18',
      '1 Corinthians 13:4-7',
      'Galatians 5:22',
      'Ephesians 4:2',
      'Ephesians 4:32',
      'Colossians 3:12-14',
      '1 Thessalonians 3:12',
      '1 Peter 4:8',
      '1 John 4:7-8',
      'Micah 6:8',
      'Luke 6:31',
      'Matthew 5:7',
      'Proverbs 17:17',
      'James 2:13',
      'Philippians 2:3-4',
      'Hebrews 13:1',
      'Psalm 103:13',
      'Zechariah 7:9'
    ]
  },
  {
    emotion: 'Faithfulness & Endurance',
    description:
      'Children need long obedience, not momentary intensity. This blessing asks God to establish steadfast character so they remain faithful through hardship and finish well.',
    icon: 'safety-certificate',
    problems: [
      'Quitting when things get hard',
      'Inconsistency in obedience',
      'Discouragement in delay',
      'Short-term thinking',
      'Weak endurance under pressure'
    ],
    blessing:
      'God, make my child faithful in small things. Teach them endurance through hardship. Let them remain steady in truth throughout their life.',
    keywordVerses: [
      'Lamentations 3:22-23',
      'Psalm 37:23-24',
      'Proverbs 20:6',
      'Matthew 25:21',
      'Luke 16:10',
      'Galatians 6:9',
      'Hebrews 10:23',
      'Hebrews 12:1-2',
      'James 1:12',
      'Revelation 2:10',
      '2 Timothy 4:7',
      'Colossians 1:11',
      '1 Corinthians 15:58',
      '2 Thessalonians 3:3',
      'Psalm 119:90',
      'Philippians 1:6',
      '1 Peter 5:10',
      'Ecclesiastes 7:8',
      'Romans 5:3-4',
      'Deuteronomy 7:9'
    ]
  }
];
