export type MentionCandidate = {
  userId: string;
  username: string;
};

export type ActiveMention = {
  start: number;
  end: number;
  query: string;
};

const USERNAME_CHARS = "A-Za-z0-9çğıöşüÇĞİÖŞÜ._\\-";
const ACTIVE_MENTION_RE = new RegExp(
  `(^|[\\s])@([${USERNAME_CHARS}]*)$`
);
const MENTION_SPLIT = new RegExp(`(@[${USERNAME_CHARS}]+)`, "g");
const MENTION_TOKEN_RE = new RegExp(`^@[${USERNAME_CHARS}]+$`);

/** Detect @query token at caret (query may be empty right after @). */
export function getActiveMention(
  text: string,
  cursor: number
): ActiveMention | null {
  const before = text.slice(0, cursor);
  const match = before.match(ACTIVE_MENTION_RE);
  if (!match) return null;

  const query = match[2] ?? "";
  const atIndex = before.lastIndexOf("@");
  if (atIndex < 0) return null;

  return {
    start: atIndex,
    end: cursor,
    query,
  };
}

export function filterMentionCandidates(
  candidates: MentionCandidate[],
  query: string,
  limit = 8
): MentionCandidate[] {
  const q = query.trim().toLowerCase();
  const list = q
    ? candidates.filter((c) => c.username.toLowerCase().includes(q))
    : candidates;
  return list.slice(0, limit);
}

export function insertMention(
  text: string,
  mention: ActiveMention,
  username: string
): { text: string; cursor: number } {
  const inserted = `@${username} `;
  const next = text.slice(0, mention.start) + inserted + text.slice(mention.end);
  return {
    text: next,
    cursor: mention.start + inserted.length,
  };
}

/** Split content into plain text and @mention tokens for rendering. */
export function splitMentionTokens(content: string): string[] {
  return content.split(MENTION_SPLIT).filter((part) => part.length > 0);
}

export function isMentionToken(part: string): boolean {
  return MENTION_TOKEN_RE.test(part);
}
