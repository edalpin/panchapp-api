export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: AuthenticatedUser;
}
