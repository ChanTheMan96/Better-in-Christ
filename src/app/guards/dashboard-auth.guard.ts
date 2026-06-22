import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { ClerkService } from '../services/clerk.service';

export const dashboardAuthGuard: CanActivateFn = async () => {
  const clerkService = inject(ClerkService);

  await clerkService.initialize();

  if (clerkService.authState.isSignedIn) {
    return true;
  }

  await clerkService.openSignIn('/dashboard');
  return false;
};
