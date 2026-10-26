export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: SessionUser;
}
