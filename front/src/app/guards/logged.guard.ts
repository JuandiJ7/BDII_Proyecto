import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FetchService } from '../services/fetch.service';

export const loggedGuard: CanActivateFn = async (route, state) => {
  const fetch: FetchService = inject(FetchService);
  const router: Router = inject(Router);

  if (fetch.loggedUser()) {
    return true;
  }

  await router.navigate(['/auth/login']);
  return false;
};