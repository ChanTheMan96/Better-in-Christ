import { Injectable } from '@angular/core';
import { BibleService } from '../../services/bible.service';
import { BibleVersionService } from '../../services/bible-version.service';
import { GROWTH_TRAITS } from '../../data/growth.data';
import { MensHelp, MensHelpVerseResult } from '../../models/mens-help.model';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GrowthService {
  private readonly verseResultsCache = new Map<string, MensHelpVerseResult[]>();

  constructor(
    private readonly bibleService: BibleService,
    private readonly bibleVersions: BibleVersionService
  ) {}

  getTraits(): MensHelp[] {
    return GROWTH_TRAITS;
  }

  findTraitBySlug(slug: string): MensHelp | null {
    return this.getTraits().find((trait) => this.toSlug(trait.emotion) === slug) || null;
  }

  toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getGuidance(trait: MensHelp): string {
    const firstSentence = trait.description.split('. ')[0]?.trim();
    return firstSentence
      ? `${firstSentence}. Ask God to form this trait through daily obedience, humility, and trust.`
      : 'Ask God to form this trait through daily obedience, humility, and trust.';
  }

  clearVerseCache(): void {
    this.verseResultsCache.clear();
  }

  loadTraitVerses(trait: MensHelp): Observable<MensHelpVerseResult[]> {
    const version = this.bibleVersions.getSelectedVersion();
    const cacheKey = `${this.toSlug(trait.emotion)}|${version}`;
    const cached = this.verseResultsCache.get(cacheKey);
    if (cached) return of(cached);

    return from(trait.keywordVerses).pipe(
      concatMap((ref) =>
        this.bibleService.getPassage(ref).pipe(
          map((passage) => ({
            reference: passage.reference || ref,
            version: passage.translation_name || passage.translation_id || '',
            text: this.bibleService.formatPassageQuote(passage)
          })),
          catchError(() =>
            of({
              reference: ref,
              version: '',
              text: 'Unable to load verse text.'
            })
          )
        )
      ),
      toArray(),
      map((results) => {
        this.verseResultsCache.set(cacheKey, results);
        return results;
      })
    );
  }
}

