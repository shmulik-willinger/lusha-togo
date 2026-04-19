/**
 * Resolve a stable user identifier from the session.
 * Priority: session.userId → JWT in cookie → session.email
 */
export function resolveUserId(session: { userId?: string; cookie?: string; email?: string } | null | undefined): string | undefined {
  if (!session) return undefined;
  if (session.userId && session.userId !== 'anonymous') return session.userId;

  // Try to decode from the ll/sall JWT in the cookie string
  if (session.cookie) {
    try {
      const llMatch = session.cookie.match(/(?:^|;\s*)(?:ll|sall)=([^;]+)/);
      if (llMatch) {
        const parts = llMatch[1].split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded));
          const rawId = payload.userId?.toString()
            || payload.sub?.toString()
            || payload.id?.toString()
            || payload.user_id?.toString()
            || payload.uid?.toString()
            || payload.account_id?.toString();
          if (rawId && rawId !== 'anonymous') return rawId;
        }
      }
    } catch { /* fall through */ }
  }

  // Last resort: use email as a stable unique identifier
  return session.email && session.email.includes('@') ? session.email : undefined;
}
