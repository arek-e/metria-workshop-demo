import { UserRole } from '../shared/domain/user-role';

export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous' | 'error';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  roles: readonly UserRole[];
  rawRoles: readonly string[];
}

export interface AuthState {
  status: AuthStatus;
  user?: AuthUser;
  error?: string;
}
