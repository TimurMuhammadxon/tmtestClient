export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  exp: number;
  given_name?: string;
  family_name?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRole(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? null;
}

export function getUserId(token: string): string | null {
  return decodeJwt(token)?.sub ?? null;
}

export function getEmail(token: string): string | null {
  return decodeJwt(token)?.email ?? null;
}
