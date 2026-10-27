// Runs in logic functions (Node): the front component has no Buffer.

// The installed application's id: the app access token's `applicationId` claim. It is
// the id in /settings/applications/<id>. Null when the token is not a JWT.
export const applicationIdFromToken = (token: string | undefined): string | null => {
  const part = token?.split('.')[1];
  if (!part) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as { applicationId?: unknown };
    return typeof claims.applicationId === 'string' && /^[0-9a-f-]{36}$/i.test(claims.applicationId)
      ? claims.applicationId
      : null;
  } catch {
    return null;
  }
};

