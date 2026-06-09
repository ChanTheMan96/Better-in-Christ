import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BibleVersionOption, BibleVersionService } from './services/bible-version.service';
import { BibleService } from './services/bible.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'betterinchrist';
  versionModalVisible = false;
  versionReady = true;
  loadingVersions = false;
  versionLoadError = '';
  versions: BibleVersionOption[] = [];

  constructor(
    private bibleVersions: BibleVersionService,
    public bibleService: BibleService
  ) {}

  ngOnInit(): void {
    const selectedVersionId = this.bibleVersions.getSelectedVersion();
    this.bibleVersions.setSelectedVersion(selectedVersionId);
    this.loadVersions(selectedVersionId);
  }

  private loadVersions(selectedVersionId: string): void {
    this.bibleVersions.getAvailableVersions().subscribe({
      next: (versions) => {
        this.versions = versions;
        if (!this.versions.some((v) => v.id === selectedVersionId)) {
          this.bibleVersions.setSelectedVersion(this.versions[0]?.id || selectedVersionId);
        }
        this.loadingVersions = false;
      },
      error: (err: HttpErrorResponse) => {
        const detail = err?.status ? ` (HTTP ${err.status}${err.statusText ? ` ${err.statusText}` : ''})` : '';
        this.versionLoadError = `Unable to load Bible versions from api.bible${detail}.`;
        this.loadingVersions = false;
        this.versions = [{
          id: selectedVersionId,
          name: 'Default',
          abbreviation: '',
          language: ''
        }];
      }
    });
  }

  openVersionModal(): void {
    this.versionModalVisible = true;
    this.versionLoadError = '';

    if (this.versions.length > 0) {
      this.loadingVersions = false;
      return;
    }

    this.loadingVersions = true;
    this.loadVersions(this.bibleVersions.getSelectedVersion());
  }

  chooseVersion(versionId: string): void {
    if (!versionId) return;
    this.bibleVersions.setSelectedVersion(versionId);
    this.versionModalVisible = false;
    this.versionReady = true;
  }
}
