export enum JwtTokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

export interface JwtPayload {
  sub: string;
  typ: JwtTokenType;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}
