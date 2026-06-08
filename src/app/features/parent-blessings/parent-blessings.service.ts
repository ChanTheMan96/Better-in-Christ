import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { ParentBlessingCategory, PARENT_BLESSINGS } from '../../data/parent-blessings.data';
import { MensHelpVerseResult } from '../../models/mens-help.model';
import { BibleService } from '../../services/bible.service';
import { BibleVersionService } from '../../services/bible-version.service';

@Injectable({
  providedIn: 'root'
})
export class ParentBlessingsService {
  private readonly verseResultsCache = new Map<string, MensHelpVerseResult[]>();

  constructor(
    private readonly bibleService: BibleService,
    private readonly bibleVersions: BibleVersionService
  ) {}

  getCategories(): ParentBlessingCategory[] {
    return PARENT_BLESSINGS;
  }

  findCategoryBySlug(slug: string): ParentBlessingCategory | null {
    return this.getCategories().find((category) => this.toSlug(category.emotion) === slug) || null;
  }

  toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getGuidance(category: ParentBlessingCategory): string {
    const firstSentence = category.description.split('. ')[0]?.trim();
    return firstSentence
      ? `${firstSentence}. Pray this over your child with consistency, humility, and faith.`
      : 'Pray this over your child with consistency, humility, and faith.';
  }

  clearVerseCache(): void {
    this.verseResultsCache.clear();
  }

  loadCategoryVerses(category: ParentBlessingCategory): Observable<MensHelpVerseResult[]> {
    const version = this.bibleVersions.getSelectedVersion();
    const cacheKey = `${this.toSlug(category.emotion)}|${version}`;
    const cached = this.verseResultsCache.get(cacheKey);
    if (cached) return of(cached);

    return from(category.keywordVerses).pipe(
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

