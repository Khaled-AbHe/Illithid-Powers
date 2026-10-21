import type { Role } from "../db/schema";

/** What guards attach to `request.user` (always read fresh from the DB). */
export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

/** Claims inside the JWT. `sub` is the user id as a string, per the JWT spec. */
export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
}
