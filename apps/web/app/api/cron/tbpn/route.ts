import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import { extractCompaniesFromEpisode, geocodeLocationHint } from '@/lib/tbpn/extract';

const TBPN_FEED = 'https://feeds.transistor.fm/technology-brother';
const JOB = 'tbpn_ingest';
const MAX_EPISODES_PER_RUN = 5;

interface Episode {
  guid: string;
  title: string;
  description: string;
  pubDate: string;
}

export async function GET(request: Request) {
  // Auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET}
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: state } = await admin
    .from('cron_state')
    .select('last_ref')
    .eq('job', JOB)
    .maybeSingle();
  const lastRef = state?.last_ref ?? null;

  let episodes: Episode[];
  try {
    episodes = await fetchRecentEpisodes();
  } catch (err) {
    console.error('Failed to fetch TBPN feed:', err);
    return NextResponse.json({ error: 'feed_fetch_failed' }, { status: 500 });
  }

  // Take only episodes newer than the last processed GUID, oldest first so the
  // next run sees the right lastRef. Cap per-run to protect timeouts + tokens.
  const newEpisodes: Episode[] = [];
  for (const ep of episodes) {
    if (ep.guid === lastRef) break;
    newEpisodes.push(ep);
  }
  const toProcess = newEpisodes.slice(0, MAX_EPISODES_PER_RUN).reverse();

  let inserted = 0;
  let skipped = 0;

  for (const ep of toProcess) {
    let companies;
    try {
      companies = await extractCompaniesFromEpisode(ep.title, ep.description);
    } catch (err) {
      console.error('Extraction failed for episode', ep.guid, err);
      continue;
    }

    for (const c of companies) {
      const { data: existing } = await admin
        .from('companies')
        .select('id')
        .ilike('name', c.name)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      const geo = await geocodeLocationHint(c.location_hint);

      const { error } = await admin.from('companies').insert({
        name: c.name,
        description: c.description,
        website: c.website,
        sector: c.sector,
        interest_categories: [],
        teen_roles: ['intern', 'tour'],
        funding_stage: c.funding_stage,
        funding_raised_usd: c.funding_raised_usd,
        hiring_signal: c.hiring_signal,
        city: geo?.city ?? c.location_hint,
        region: geo?.region ?? null,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        source: 'tbpn',
        source_ref: ep.guid,
        is_active: true,
      });
      if (error) {
        console.error('Insert company failed:', c.name, error);
      } else {
        inserted++;
      }
    }
  }

  const lastProcessedGuid = toProcess.length > 0 ? toProcess[toProcess.length - 1].guid : lastRef;
  await admin.from('cron_state').upsert({
    job: JOB,
    last_ref: lastProcessedGuid,
    last_run_at: new Date().toISOString(),
    notes: `processed=${toProcess.length} inserted=${inserted} skipped=${skipped}`,
  });

  return NextResponse.json({
    ok: true,
    processed: toProcess.length,
    inserted,
    skipped,
    newestGuid: lastProcessedGuid,
  });
}

async function fetchRecentEpisodes(): Promise<Episode[]> {
  const res = await fetch(TBPN_FEED, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Feed fetch ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: Array<Record<string, unknown>> | Record<string, unknown> } };
  };
  const rawItems = parsed.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  return items
    .map((it): Episode | null => {
      const guid = typeof it.guid === 'string' ? it.guid : (it.guid as { '#text'?: string })?.['#text'];
      const title = (it.title as string) ?? '';
      const description = (it.description as string) ?? '';
      const pubDate = (it.pubDate as string) ?? '';
      if (!guid) return null;
      return { guid, title, description, pubDate };
    })
    .filter((x): x is Episode => x !== null);
}
