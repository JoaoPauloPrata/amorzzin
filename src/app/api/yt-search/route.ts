import { NextRequest, NextResponse } from "next/server";
import type { YtSearchResult } from "@/lib/utils/youtube";

// Busca de músicas no YouTube (Data API v3), server-side pra não expor a key.
// Quota: search.list = 100 unidades/chamada. Cache em memória + debounce no client
// reduzem o gasto. Em prod, pedir aumento de quota se necessário.
//
// Secret necessário: YOUTUBE_API_KEY (Google Cloud → YouTube Data API v3 habilitada).

const API_KEY = process.env.YOUTUBE_API_KEY;

// Cache simples em memória: query normalizada → resultados, com TTL.
type CacheEntry = { at: number; results: YtSearchResult[] };
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const CACHE_MAX = 200;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  if (!API_KEY) {
    console.error("yt-search: YOUTUBE_API_KEY ausente");
    return NextResponse.json({ error: "search not configured" }, { status: 500 });
  }

  const cacheKey = q.toLowerCase();
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(
      { results: cached.results },
      { headers: { "Cache-Control": "private, max-age=600" } },
    );
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true"); // só vídeos embutíveis (pra tocar na página)
  url.searchParams.set("maxResults", "6");
  url.searchParams.set("q", q);

  let data: { items?: unknown[] };
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      const text = await r.text();
      console.error("yt-search YouTube API erro", r.status, text.slice(0, 300));
      return NextResponse.json({ error: "search failed" }, { status: 502 });
    }
    data = await r.json();
  } catch (err) {
    console.error("yt-search fetch threw", err);
    return NextResponse.json({ error: "search failed" }, { status: 502 });
  }

  const results: YtSearchResult[] = (data.items ?? [])
    .map((raw) => {
      const it = raw as {
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
        };
      };
      const videoId = it.id?.videoId;
      if (!videoId) return null;
      return {
        videoId,
        title:   decodeEntities(it.snippet?.title ?? ""),
        channel: decodeEntities(it.snippet?.channelTitle ?? ""),
        thumb:   it.snippet?.thumbnails?.default?.url ?? it.snippet?.thumbnails?.medium?.url ?? "",
      };
    })
    .filter((x): x is YtSearchResult => x !== null);

  // grava no cache (evict LRU-ish por tamanho)
  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  CACHE.set(cacheKey, { at: Date.now(), results });

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "private, max-age=600" } },
  );
}
