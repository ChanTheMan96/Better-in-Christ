export interface GuidanceCategory {
  emotion: string;
  description: string;
  icon: string;
  problems: string[];
  keywordVerses: string[];
}

export interface GuidanceVerseResult {
  reference: string;
  version: string;
  text: string;
}
