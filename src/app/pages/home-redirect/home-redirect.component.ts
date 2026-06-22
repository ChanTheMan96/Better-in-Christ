import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClerkService } from 'src/app/services/clerk.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  constructor(
    private clerkService: ClerkService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.clerkService.initialize();
    const target = this.clerkService.authState.isSignedIn
      ? '/dashboard'
      : '/scroll';
    await this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
