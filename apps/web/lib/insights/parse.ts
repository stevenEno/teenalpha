// Tiny YAML frontmatter parser for Obsidian-style markdown — tuned for the
// fields we care about, not a full YAML implementation.

export interface ParsedInsight {
  title: string | null;
  url: string | null;
  source: string | null;
  author: string | null;
  date: string | null;
  tags: string[];
  takeaway: string | null;
  audience: string[];
  body_md: string;
}

export function parseInsightMarkdown(input: string): ParsedInsight {
  const trimmed = input.replace(/^\uFEFF/, '').trim();
  let frontmatter: Record<string, string> = {};
  let body = trimmed;

  const fmMatch = trimmed.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fmMatch) {
    frontmatter = parseFrontmatter(fmMatch[1]);
    body = fmMatch[2].trim();
  }

  const tags = parseList(frontmatter.tags);
  const audience = parseList(frontmatter.audience);

  return {
    title: frontmatter.title ?? deriveTitleFromBody(body),
    url: frontmatter.url ?? null,
    source: frontmatter.source ?? null,
    author: frontmatter.author ?? null,
    date: frontmatter.date ?? null,
    tags,
    takeaway: frontmatter.takeaway ?? null,
    audience: audience.length > 0 ? audience : ['teens', 'mentors'],
    body_md: body,
  };
}

function parseFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  const inner = raw.replace(/^\[|\]$/g, '').trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

function deriveTitleFromBody(body: string): string | null {
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const firstLine = body.split('\n')[0]?.trim();
  return firstLine ? firstLine.slice(0, 120) : null;
}
