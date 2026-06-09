import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClerkService } from 'src/app/services/clerk.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(private clerkService: ClerkService) {}

  login() {
    this.clerkService.openSignIn();
  }
}
