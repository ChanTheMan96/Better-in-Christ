import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, defer, from, of, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, mergeMap, shareReplay, toArray } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BibleVersionService } from './bible-version.service';
import { BIBLE_BOOKS_BY_VERSION } from '../data/bible-books.data';

export interface BibleVerse {
  book_id?: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  verses: BibleVerse[];
  text?: string;
  translation_id?: string;
  translation_name?: string;
}

interface ApiBibleResponse<T> {
  data: T;
}

interface ApiBiblePassageData {
  id: string;
  bibleId?: string;
  reference?: string;
  content?: unknown;
}

interface ParsedReference {
  original: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

interface ChapterCacheEntry {
  reference: string;
  fullText: string;
  verses: Map<number, string>;
}

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  private readonly base = environment.apiBible.baseUrl;
  private readonly chapterCache = new Map<string, Observable<ChapterCacheEntry>>();
  private readonly passageCache = new Map<string, Observable<BiblePassage>>();
  private readonly pendingBibleRequests$ = new BehaviorSubject<number>(0);
  readonly isBibleLoading$ = this.pendingBibleRequests$.pipe(
    map((count) => count > 0),
    distinctUntilChanged()
  );
  private readonly versionNameById = new Map<string, string>([
    ['78a9f6124f344018-01', 'NIV'],
    ['d6e14a625393b4da-01', 'NLT'],
    ['63097d2a0a2f7db3-01', 'NKJV']
  ]);
  private readonly bookAliasByVersion = this.buildBookAliasIndex();

  constructor(
    private http: HttpClient,
    private versions: BibleVersionService
  ) {}

  private cleanText(s: string | undefined | null): string {
    if (!s) return '';
    return s
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeBookAlias(input: string): string {
    return input.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private buildBookAliasIndex(): Map<string, Map<string, string>> {
    const index = new Map<string, Map<string, string>>();

    Object.entries(BIBLE_BOOKS_BY_VERSION).forEach(([bibleId, books]) => {
      const aliasMap = new Map<string, string>();
      books.forEach((book) => {
        const aliases = [book.name, book.nameLong, book.abbreviation, book.id];
        aliases.forEach((alias) => {
          const normalized = this.normalizeBookAlias(alias);
          if (normalized) aliasMap.set(normalized, book.id);

          // Handle common singular/plural variations (e.g., Psalm <-> Psalms).
          if (normalized.endsWith('s') && normalized.length > 1) {
            aliasMap.set(normalized.slice(0, -1), book.id);
          } else {
            aliasMap.set(`${normalized}s`, book.id);
          }
        });
      });
      index.set(bibleId, aliasMap);
    });

    return index;
  }

  private parseReference(reference: string, bibleId: string): ParsedReference | null {
    const trimmed = reference.trim();
    const m = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
    if (!m) return null;

    const [, bookRaw, chapterRaw, verseStartRaw, verseEndRaw] = m;
    const aliasMap = this.bookAliasByVersion.get(bibleId);
    const bookId = aliasMap?.get(this.normalizeBookAlias(bookRaw));
    if (!bookId) return null;

    const chapter = Number(chapterRaw);
    if (!chapter) return null;

    const verseStart = verseStartRaw ? Number(verseStartRaw) : undefined;
    const verseEnd = verseEndRaw ? Number(verseEndRaw) : undefined;

    return {
      original: trimmed,
      bookId,
      bookName: bookRaw,
      chapter,
      verseStart,
      verseEnd
    };
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'Accept': 'application/json'
    });
  }

  private trackLoading<T>(source$: Observable<T>): Observable<T> {
    return defer(() => {
      this.pendingBibleRequests$.next(this.pendingBibleRequests$.value + 1);
      return source$.pipe(
        finalize(() => {
          const next = Math.max(0, this.pendingBibleRequests$.value - 1);
          this.pendingBibleRequests$.next(next);
        })
      );
    });
  }

  private extractVerseFromUsfm(usfm: string | undefined): number | null {
    if (!usfm) return null;
    const m = usfm.match(/\.(\d+)(?:-\d+)?$/);
    return m ? Number(m[1]) : null;
  }

  private extractVerseFromVerseId(verseId: string | undefined): number | null {
    if (!verseId) return null;
    const m = verseId.match(/\.(\d+)(?:-\d+)?$/);
    return m ? Number(m[1]) : null;
  }

  private extractVerseFromSid(sid: string | undefined): number | null {
    if (!sid) return null;
    const m = sid.match(/:(\d+)(?:-\d+)?$/);
    return m ? Number(m[1]) : null;
  }

  private appendVerseText(map: Map<number, string>, verse: number, text: string): void {
    const clean = this.stripLeadingVerseNumber(text, verse);
    if (/^\d+$/.test(clean)) return;
    if (!clean) return;
    const prev = map.get(verse);
    map.set(verse, prev ? `${prev} ${clean}`.trim() : clean);
  }

  private stripLeadingVerseNumber(text: string, verse?: number): string {
    let out = this.cleanText(text);
    if (verse !== undefined) {
      out = out.replace(new RegExp(`^${verse}[\\s.)-]*`), '');
    }
    out = out.replace(/^\d+[\s.)-]*/, '');
    return this.normalizePunctuationSpacing(out).trim();
  }

  private normalizePunctuationSpacing(text: string): string {
    return text
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/([‘“(])\s+/g, '$1')
      .replace(/\s+([’”)])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractVersesFromJsonContent(content: unknown): Map<number, string> {
    const verses = new Map<number, string>();

    const walk = (node: unknown, currentVerse: number | null): number | null => {
      if (node == null) return currentVerse;

      if (typeof node === 'string') {
        if (currentVerse !== null) this.appendVerseText(verses, currentVerse, node);
        return currentVerse;
      }

      if (Array.isArray(node)) {
        let verse = currentVerse;
        node.forEach((item) => {
          verse = walk(item, verse);
        });
        return verse;
      }

      if (typeof node !== 'object') return currentVerse;

      const obj = node as Record<string, unknown>;
      const attrs = (obj['attrs'] as Record<string, unknown>) || {};
      let nextVerse = currentVerse;

      const verseIdRaw = attrs['verseId'] ?? attrs['data-verse-id'];
      if (typeof verseIdRaw === 'string') {
        const parsedFromVerseId = this.extractVerseFromVerseId(verseIdRaw);
        if (parsedFromVerseId) nextVerse = parsedFromVerseId;
      }

      if (nextVerse === null) {
        const sidRaw = attrs['sid'];
        if (typeof sidRaw === 'string') {
          const parsedFromSid = this.extractVerseFromSid(sidRaw);
          if (parsedFromSid) nextVerse = parsedFromSid;
        }
      }

      const numberRaw = attrs['number'] ?? attrs['data-number'];
      if (typeof numberRaw === 'string' || typeof numberRaw === 'number') {
        const parsed = Number(numberRaw);
        if (Number.isFinite(parsed) && parsed > 0) nextVerse = parsed;
      }

      if (nextVerse === null) {
        const usfm = (attrs['data-usfm'] as string) || (attrs['usfm'] as string) || (obj['usfm'] as string);
        const parsedUsfm = this.extractVerseFromUsfm(usfm);
        if (parsedUsfm) nextVerse = parsedUsfm;
      }

      const hasItems = Array.isArray(obj['items']);
      if (nextVerse === null && typeof obj['verseId'] === 'string') {
        const parsedFromObjVerseId = this.extractVerseFromVerseId(obj['verseId']);
        if (parsedFromObjVerseId) nextVerse = parsedFromObjVerseId;
      }

      if (!hasItems && typeof obj['text'] === 'string' && nextVerse !== null) {
        this.appendVerseText(verses, nextVerse, obj['text']);
      }
      if (!hasItems && typeof obj['literal'] === 'string' && nextVerse !== null) {
        this.appendVerseText(verses, nextVerse, obj['literal']);
      }

      if (obj['items'] !== undefined) {
        walk(obj['items'], nextVerse);
      }

      return nextVerse;
    };

    walk(content, null);
    return verses;
  }

  private extractVersesFromPlainText(content: string): Map<number, string> {
    const verses = new Map<number, string>();
    const text = this.cleanText(content);
    if (!text) return verses;

    const markers: { verse: number; index: number; markerLength: number }[] = [];
    const re = /(?:^|\s)(\d{1,3})(?=\s)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      markers.push({
        verse: Number(m[1]),
        index: m.index,
        markerLength: m[0].length
      });
    }

    for (let i = 0; i < markers.length; i += 1) {
      const start = markers[i].index + markers[i].markerLength;
      const end = i + 1 < markers.length ? markers[i + 1].index : text.length;
      this.appendVerseText(verses, markers[i].verse, text.slice(start, end));
    }

    return verses;
  }

  private extractVerseMap(content: unknown): Map<number, string> {
    if (typeof content === 'string') {
      return this.extractVersesFromPlainText(content);
    }
    return this.extractVersesFromJsonContent(content);
  }

  private fetchChapter(bibleId: string, parsed: ParsedReference): Observable<ChapterCacheEntry> {
    const chapterId = `${parsed.bookId}.${parsed.chapter}`;
    const cacheKey = `${bibleId}|${chapterId}`;
    const cached = this.chapterCache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.base}/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(chapterId)}`;
    const params = new HttpParams()
      .set('content-type', 'json')
      .set('include-verse-spans', 'true')
      .set('include-verse-numbers', 'true')
      .set('include-notes', 'false')
      .set('include-titles', 'false')
      .set('include-chapter-numbers', 'false');

    const request$ = this.trackLoading(
      this.http.get<ApiBibleResponse<ApiBiblePassageData>>(url, { headers: this.headers(), params })
    ).pipe(
      map((res) => {
        const data = res?.data || {};
        const verses = this.extractVerseMap(data.content);
        const fullText = verses.size
          ? Array.from(verses.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([, verseText]) => verseText)
              .join(' ')
              .trim()
          : this.cleanText(typeof data.content === 'string' ? data.content : JSON.stringify(data.content || ''));

        return {
          reference: data.reference || `${parsed.bookName} ${parsed.chapter}`,
          fullText,
          verses
        } satisfies ChapterCacheEntry;
      }),
      catchError((err) => {
        this.chapterCache.delete(cacheKey);
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    this.chapterCache.set(cacheKey, request$);
    return request$;
  }

  private buildPassageFromChapter(chapterData: ChapterCacheEntry, parsed: ParsedReference, bibleId: string): BiblePassage {
    let verses: BibleVerse[] = [];

    if (parsed.verseStart) {
      const end = parsed.verseEnd ?? parsed.verseStart;
      for (let v = parsed.verseStart; v <= end; v += 1) {
        const text = chapterData.verses.get(v);
        if (!text) continue;
        verses.push({
          book_name: parsed.bookName,
          chapter: parsed.chapter,
          verse: v,
          text: this.stripLeadingVerseNumber(text, v)
        });
      }
    } else {
      verses = Array.from(chapterData.verses.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([verse, text]) => ({
          book_name: parsed.bookName,
          chapter: parsed.chapter,
          verse,
          text: this.stripLeadingVerseNumber(text, verse)
        }));
    }

    const text = verses.length
      ? verses.map((v) => v.text).join(' ').trim()
      : chapterData.fullText;

    return {
      reference: parsed.original,
      verses,
      text,
      translation_id: bibleId,
      translation_name: this.versionNameById.get(bibleId) || bibleId
    };
  }

  formatPassageQuote(passage: BiblePassage): string {
    const body = this.normalizePunctuationSpacing(passage.text || '').trim();
    return body;
  }

  formatPassageLabel(passage: BiblePassage, fallbackRef: string): string {
    const ref = passage.reference || fallbackRef;
    const version = passage.translation_name || passage.translation_id || '';
    return version ? `${ref} (${version})` : ref;
  }

  getPassage(ref: string, bibleId = this.versions.getSelectedVersion() || environment.apiBible.defaultBibleId): Observable<BiblePassage> {
    const cacheReference = ref.trim();
    const passageCacheKey = `${bibleId}|${cacheReference}`;
    const cachedPassage = this.passageCache.get(passageCacheKey);
    if (cachedPassage) return cachedPassage;

    const parsed = this.parseReference(cacheReference, bibleId);
    if (!parsed) {
      return throwError(() => new Error(`Could not parse reference "${ref}" for selected bible.`));
    }

    const request$ = this.fetchChapter(bibleId, parsed).pipe(
      map((chapterData) => this.buildPassageFromChapter(chapterData, parsed, bibleId)),
      catchError((err) => {
        this.passageCache.delete(passageCacheKey);
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    this.passageCache.set(passageCacheKey, request$);
    return request$;
  }

  prefetchPassages(refs: string[], concurrency = 8): Observable<void> {
    const uniqueRefs = [...new Set(refs.map((ref) => ref.trim()).filter(Boolean))];
    return from(uniqueRefs).pipe(
      mergeMap((ref) => this.getPassage(ref).pipe(catchError(() => EMPTY)), concurrency),
      toArray(),
      map(() => void 0)
    );
  }

  prefetchSomePassages(refs: string[], maxCount: number, concurrency = 2): Observable<void> {
    const limited = refs.slice(0, Math.max(0, maxCount));
    return this.prefetchPassages(limited, concurrency);
  }
}
