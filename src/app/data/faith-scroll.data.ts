export interface FaithScrollCategory {
  name: string;
  refs: string[];
  sectionTitleByRef?: Record<string, string>;
  textByRef?: Record<string, string>;
  preserveOrder?: boolean;
}

export const JESUS_WORDS_CATEGORY: FaithScrollCategory = {
  name: 'Christ Words',
  refs: [
    'Matthew 5:3-10',
    'Matthew 5:11-12',
    'Matthew 5:14-16',
    'Matthew 5:17-20',
    'Matthew 5:21-24',
    'Matthew 5:27-30',
    'Matthew 5:37',
    'Matthew 5:44-45',
    'Matthew 6:3-4',
    'Matthew 6:6',
    'Matthew 6:9-13',
    'Matthew 6:19-21',
    'Matthew 6:22-24',
    'Matthew 6:25-34',
    'Matthew 7:1-5',
    'Matthew 7:7-8',
    'Matthew 7:12',
    'Matthew 7:13-14',
    'Matthew 7:24-27',
    'Matthew 11:28-30',
    'Matthew 16:24-26',
    'Mark 10:43-45',
    'Luke 6:27-31',
    'Luke 12:32-34',
    'John 10:27-30',
    'John 11:25-26',
    'John 13:34-35',
    'John 14:1-3',
    'John 14:15-17',
    'John 14:27',
    'John 15:4-5',
    'John 15:9-13',
    'John 16:33',
  ],
};

const ACCEPTED_TITLE = 'I Am Accepted...';
const SECURE_TITLE = 'I Am Secure...';
const SIGNIFICANT_TITLE = 'I Am Significant...';

export const WHO_I_AM_IN_CHRIST_CATEGORY = 'Who I Am in Christ';
export const WHO_I_AM_ACCEPTED_CATEGORY = 'I Am Accepted';
export const WHO_I_AM_SECURE_CATEGORY = 'I Am Secure';
export const WHO_I_AM_SIGNIFICANT_CATEGORY = 'I Am Significant';

const WHO_I_AM_ACCEPTED_REFS = [
  'John 1:12',
  'John 15:15',
  'Romans 5:1',
  '1 Corinthians 6:17',
  '1 Corinthians 6:19-20',
  '1 Corinthians 12:27',
  'Ephesians 1:3-8',
  'Colossians 1:13-14',
  'Colossians 2:9-10',
  'Hebrews 4:14-16',
];

const WHO_I_AM_SECURE_REFS = [
  'Romans 8:1-2',
  'Romans 8:28',
  'Romans 8:31-39',
  '2 Corinthians 1:21-22',
  'Colossians 3:1-4',
  'Philippians 1:6',
  'Philippians 3:20',
  '2 Timothy 1:7',
  '1 John 5:18',
];

const WHO_I_AM_SIGNIFICANT_REFS = [
  'John 15:5',
  'John 15:16',
  '1 Corinthians 3:16',
  '2 Corinthians 5:17-21',
  'Ephesians 2:6',
  'Ephesians 2:10',
  'Ephesians 3:12',
  'Philippians 4:13',
];

function sectionMap(refs: string[], title: string): Record<string, string> {
  return Object.fromEntries(refs.map((ref) => [ref, title]));
}

const WHO_I_AM_ACCEPTED_TEXT: Record<string, string> = {
  'John 1:12': "I am God's child.",
  'John 15:15': 'As a disciple, I am a friend of Jesus Christ.',
  'Romans 5:1': 'I have been justified.',
  '1 Corinthians 6:17': 'I am united with the Lord, and I am one with Him in spirit.',
  '1 Corinthians 6:19-20': 'I have been bought with a price and I belong to God.',
  '1 Corinthians 12:27': "I am a member of Christ's body.",
  'Ephesians 1:3-8': 'I have been chosen by God and adopted as His child.',
  'Colossians 1:13-14': 'I have been redeemed and forgiven of all my sins.',
  'Colossians 2:9-10': 'I am complete in Christ.',
  'Hebrews 4:14-16': 'I have direct access to the throne of grace through Jesus Christ.',
};

const WHO_I_AM_SECURE_TEXT: Record<string, string> = {
  'Romans 8:1-2': 'I am free from condemnation.',
  'Romans 8:28': 'I am assured that God works for my good in all circumstances.',
  'Romans 8:31-39': 'I cannot be separated from the love of God.',
  '2 Corinthians 1:21-22': 'I have been established, anointed and sealed by God.',
  'Colossians 3:1-4': 'I am hidden with Christ in God.',
  'Philippians 1:6': 'I am confident that God will complete the good work He started in me.',
  'Philippians 3:20': 'I am a citizen of heaven.',
  '2 Timothy 1:7': 'I have not been given a spirit of fear but of power, love and a sound mind.',
  '1 John 5:18': 'I am born of God and the evil one cannot touch me.',
};

const WHO_I_AM_SIGNIFICANT_TEXT: Record<string, string> = {
  'John 15:5': 'I am a branch of Jesus Christ, the true vine, and a channel of His life.',
  'John 15:16': 'I have been chosen and appointed to bear fruit.',
  '1 Corinthians 3:16': "I am God's temple.",
  '2 Corinthians 5:17-21': 'I am a minister of reconciliation for God.',
  'Ephesians 2:6': 'I am seated with Jesus Christ in the heavenly realm.',
  'Ephesians 2:10': "I am God's workmanship.",
  'Ephesians 3:12': 'I may approach God with freedom and confidence.',
  'Philippians 4:13': 'I can do all things through Christ, who strengthens me.',
};

const WHO_I_AM_TEXT_BY_REF: Record<string, string> = {
  ...WHO_I_AM_ACCEPTED_TEXT,
  ...WHO_I_AM_SECURE_TEXT,
  ...WHO_I_AM_SIGNIFICANT_TEXT,
};

export const WHO_I_AM_CATEGORIES: FaithScrollCategory[] = [
  {
    name: WHO_I_AM_IN_CHRIST_CATEGORY,
    refs: [
      ...WHO_I_AM_ACCEPTED_REFS,
      ...WHO_I_AM_SECURE_REFS,
      ...WHO_I_AM_SIGNIFICANT_REFS,
    ],
    sectionTitleByRef: {
      ...sectionMap(WHO_I_AM_ACCEPTED_REFS, ACCEPTED_TITLE),
      ...sectionMap(WHO_I_AM_SECURE_REFS, SECURE_TITLE),
      ...sectionMap(WHO_I_AM_SIGNIFICANT_REFS, SIGNIFICANT_TITLE),
    },
    textByRef: WHO_I_AM_TEXT_BY_REF,
    preserveOrder: true,
  },
  {
    name: WHO_I_AM_ACCEPTED_CATEGORY,
    refs: WHO_I_AM_ACCEPTED_REFS,
    sectionTitleByRef: sectionMap(WHO_I_AM_ACCEPTED_REFS, ACCEPTED_TITLE),
    textByRef: WHO_I_AM_ACCEPTED_TEXT,
    preserveOrder: true,
  },
  {
    name: WHO_I_AM_SECURE_CATEGORY,
    refs: WHO_I_AM_SECURE_REFS,
    sectionTitleByRef: sectionMap(WHO_I_AM_SECURE_REFS, SECURE_TITLE),
    textByRef: WHO_I_AM_SECURE_TEXT,
    preserveOrder: true,
  },
  {
    name: WHO_I_AM_SIGNIFICANT_CATEGORY,
    refs: WHO_I_AM_SIGNIFICANT_REFS,
    sectionTitleByRef: sectionMap(WHO_I_AM_SIGNIFICANT_REFS, SIGNIFICANT_TITLE),
    textByRef: WHO_I_AM_SIGNIFICANT_TEXT,
    preserveOrder: true,
  },
];

export const FAITH_SCROLL_CATEGORIES: FaithScrollCategory[] = [
  {
    name: 'Faith',
    refs: [
      'John 3:16',
      'Hebrews 11:1',
      'Romans 10:17',
      'Ephesians 2:8-9',
      '2 Corinthians 5:7',
      'Galatians 2:20',
      'Mark 11:22-24',
      'James 1:6',
      'Hebrews 11:6',
      'Romans 1:17',
      'Habakkuk 2:4',
      'Matthew 17:20',
      'Luke 17:5-6',
      '1 Peter 1:8-9',
      '1 John 5:4',
      'Psalm 46:10',
      'Proverbs 3:5-6',
      'Isaiah 41:10',
      'Joshua 1:9',
      'Philippians 4:13',
      'Romans 8:28',
      'Romans 15:13',
      'Hebrews 12:2',
      'Psalm 23:1-4',
      'Psalm 27:1',
      'Psalm 37:5',
      'Psalm 56:3-4',
      'Isaiah 26:3-4',
      'Isaiah 40:31',
      'Jeremiah 17:7-8',
      'Lamentations 3:22-24',
      'Matthew 6:33',
      'Matthew 11:28-30',
      'John 14:1',
      'John 14:27',
      'John 16:33',
      'Romans 5:1-5',
      'Romans 8:31-39',
      '1 Corinthians 16:13',
      '2 Corinthians 4:16-18',
      'Ephesians 3:16-17',
      'Ephesians 6:16',
      'Colossians 2:6-7',
      '1 Thessalonians 5:8',
      '2 Timothy 1:7',
      'Hebrews 10:23',
      'Hebrews 10:35-39',
      '1 Peter 5:7',
      'Jude 1:20-21',
      'Psalm 121:1-2',
    ],
  },
];
