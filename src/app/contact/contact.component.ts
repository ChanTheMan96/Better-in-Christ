import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private readonly supportEmail = 'betterinchristsupport@gmail.com';
  name = '';
  email = '';
  page = '';
  device = '';
  message = '';

  get bugReportUrl(): string {
    const body = [
      `Name: ${this.name || 'Not provided'}`,
      `Email: ${this.email || 'Not provided'}`,
      `Page or feature: ${this.page || 'Not provided'}`,
      `Device/browser: ${this.device || 'Not provided'}`,
      '',
      'Bug details:',
      this.message || 'Not provided'
    ].join('\n');

    const subject = encodeURIComponent('Better in Christ Bug Report');
    const encodedBody = encodeURIComponent(body);

    return `mailto:${this.supportEmail}?subject=${subject}&body=${encodedBody}`;
  }
}
