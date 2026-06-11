import { Injectable, OnDestroy, inject } from '@angular/core';
import Keycloak, { KeycloakProfile } from 'keycloak-js';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

import { KEYCLOAK_AUTH_CONFIG } from './auth.config';
import { AUTH_INITIAL_STATE, buildAuthUser } from './auth-state';
import { AuthState } from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthStore implements OnDestroy {
  private readonly config = inject(KEYCLOAK_AUTH_CONFIG);
  private readonly keycloak: Keycloak;
  private readonly stateSubject = new BehaviorSubject<AuthState>(AUTH_INITIAL_STATE);
  private initialized = false;
  private refreshHandle?: number;

  readonly state$: Observable<AuthState> = this.stateSubject.asObservable();
  readonly authenticated$ = this.state$.pipe(
    map((state) => state.status === 'authenticated'),
    distinctUntilChanged(),
  );
  readonly roles$ = this.state$.pipe(
    map((state) => state.user?.roles ?? []),
    distinctUntilChanged(sameStringArray),
  );

  constructor() {
    this.keycloak = new Keycloak({
      url: this.config.url,
      realm: this.config.realm,
      clientId: this.config.clientId,
    });
    this.bindKeycloakEvents();
  }

  get snapshot(): AuthState {
    return this.stateSubject.value;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    if (!this.canUseBrowser() || this.isAuthDisabledForE2e()) {
      this.stateSubject.next({ status: 'anonymous' });
      return;
    }

    this.stateSubject.next(AUTH_INITIAL_STATE);

    try {
      const reachable = await this.ensureKeycloakAvailable({ reportError: false });

      if (!reachable) {
        return;
      }

      const authenticated = await this.keycloak.init(this.buildInitOptions());

      if (!authenticated) {
        this.stateSubject.next({ status: 'anonymous' });
        return;
      }

      await this.publishAuthenticatedState();
      this.startTokenRefresh();
    } catch (error) {
      this.stateSubject.next({
        status: 'error',
        error: authErrorMessage(error),
      });
    }
  }

  async login(): Promise<void> {
    const reachable = await this.ensureKeycloakAvailable({ reportError: true });

    if (!reachable) {
      return;
    }

    await this.keycloak.login({
      redirectUri: this.currentBrowserUrl(),
    });
  }

  async logout(): Promise<void> {
    this.stopTokenRefresh();
    await this.keycloak.logout({
      redirectUri: this.browserOrigin(),
    });
  }

  async accessToken(): Promise<string | undefined> {
    if (!this.keycloak.authenticated) {
      return undefined;
    }

    const refreshed = await this.refreshToken();

    return refreshed ? this.keycloak.token : undefined;
  }

  ngOnDestroy(): void {
    this.stopTokenRefresh();
    this.stateSubject.complete();
  }

  private bindKeycloakEvents(): void {
    this.keycloak.onAuthSuccess = () => {
      void this.publishAuthenticatedState();
    };
    this.keycloak.onAuthRefreshSuccess = () => {
      void this.publishAuthenticatedState();
    };
    this.keycloak.onAuthLogout = () => {
      this.stopTokenRefresh();
      this.stateSubject.next({ status: 'anonymous' });
    };
    this.keycloak.onAuthError = (errorData) => {
      this.stateSubject.next({
        status: 'error',
        error: errorData?.error_description ?? errorData?.error ?? 'Authentication failed.',
      });
    };
    this.keycloak.onAuthRefreshError = () => {
      this.stopTokenRefresh();
      this.stateSubject.next({
        status: 'error',
        error: 'The Keycloak session could not be refreshed.',
      });
    };
    this.keycloak.onTokenExpired = () => {
      void this.refreshToken();
    };
  }

  private buildInitOptions() {
    return {
      ...this.config.initOptions,
      redirectUri: this.config.initOptions.redirectUri ?? this.currentBrowserUrl(),
      silentCheckSsoRedirectUri:
        this.config.initOptions.silentCheckSsoRedirectUri ??
        `${this.browserOrigin()}/silent-check-sso.html`,
    };
  }

  private async refreshToken(): Promise<boolean> {
    try {
      await this.keycloak.updateToken(30);
      await this.publishAuthenticatedState();
      return true;
    } catch {
      this.stopTokenRefresh();
      this.stateSubject.next({
        status: 'error',
        error: 'The Keycloak session expired.',
      });
      return false;
    }
  }

  private async publishAuthenticatedState(): Promise<void> {
    const profile = await this.loadProfile();

    this.stateSubject.next({
      status: 'authenticated',
      user: buildAuthUser(profile, this.keycloak.tokenParsed, this.config.clientId),
    });
  }

  private async loadProfile(): Promise<KeycloakProfile | undefined> {
    try {
      return await this.keycloak.loadUserProfile();
    } catch {
      return undefined;
    }
  }

  private startTokenRefresh(): void {
    if (this.refreshHandle !== undefined || !this.canUseBrowser()) {
      return;
    }

    this.refreshHandle = window.setInterval(() => {
      void this.refreshToken();
    }, 30_000);
  }

  private stopTokenRefresh(): void {
    if (this.refreshHandle === undefined || !this.canUseBrowser()) {
      this.refreshHandle = undefined;
      return;
    }

    window.clearInterval(this.refreshHandle);
    this.refreshHandle = undefined;
  }

  private canUseBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private isAuthDisabledForE2e(): boolean {
    return (
      this.canUseBrowser() && new URLSearchParams(window.location.search).get('auth') === 'disabled'
    );
  }

  private async ensureKeycloakAvailable(options: { reportError: boolean }): Promise<boolean> {
    const controller = new AbortController();
    const timeoutHandle = window.setTimeout(() => controller.abort(), 1_200);

    try {
      await fetch(this.realmMetadataUrl(), {
        cache: 'no-store',
        mode: 'no-cors',
        signal: controller.signal,
      });
      return true;
    } catch {
      this.stateSubject.next(
        options.reportError
          ? {
              status: 'error',
              error: `Keycloak is not reachable at ${this.config.url}. Run npm run services, then reload the app.`,
            }
          : { status: 'anonymous' },
      );
      return false;
    } finally {
      window.clearTimeout(timeoutHandle);
    }
  }

  private realmMetadataUrl(): string {
    return `${this.config.url}/realms/${this.config.realm}/.well-known/openid-configuration`;
  }

  private currentBrowserUrl(): string {
    if (!this.canUseBrowser()) {
      return '/';
    }

    return window.location.href;
  }

  private browserOrigin(): string {
    if (!this.canUseBrowser()) {
      return '/';
    }

    return window.location.origin;
  }
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function authErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return 'Keycloak authentication could not be initialized.';
}
