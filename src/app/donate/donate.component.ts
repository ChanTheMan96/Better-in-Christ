import { Component, ChangeDetectionStrategy } from '@angular/core';

interface DonationAmount {
  label: string;
  value: number;
}

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DonateComponent {
  private readonly paypalEmail = 'betterinchristsupport@gmail.com';
  readonly amounts: DonationAmount[] = [
    { label: '$5', value: 5 },
    { label: '$15', value: 15 },
    { label: '$25', value: 25 },
    { label: '$50', value: 50 },
  ];
  selectedAmount = 15;

  get donationUrl(): string {
    const params = new URLSearchParams({
      cmd: '_xclick',
      business: this.paypalEmail,
      item_name: 'Better in Christ',
      currency_code: 'USD',
      amount: String(this.selectedAmount),
      no_shipping: '1',
    });

    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }

  selectAmount(amount: number): void {
    this.selectedAmount = amount;
  }
}
