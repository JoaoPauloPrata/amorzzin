// Parser de URL do YouTube.
// Aceita: youtu.be/<id>, youtube.com/watch?v=<id>, /shorts/<id>, /embed/<id>,
//         m.youtube.com/*, music.youtube.com/watch?v=<id>.
// Devolve videoId (11 chars) + URL canônica de watch + URL de embed pronta.

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export type YouTubeRef = {
  videoId:      string;
  watchUrl:     string;
  embedUrl:     string;
};

// Resultado de busca da YouTube Data API v3 (usado por /api/yt-search e Step5Music).
export type YtSearchResult = {
  videoId: string;
  title:   string;
  channel: string;
  thumb:   string;
};

export function parseYouTubeUrl(input: string | null | undefined): YouTubeRef | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Aceita ID puro também (não precisa, mas barato).
  if (VIDEO_ID_RE.test(trimmed)) return buildRef(trimmed);

  let url: URL;
  try {
    // Permite URLs sem esquema (ex.: "youtu.be/abc").
    url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "");

  let id: string | null = null;

  if (host === "youtu.be") {
    id = path.slice(1).split("/")[0] || null;
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (path === "/watch") {
      id = url.searchParams.get("v");
    } else {
      // /shorts/<id>, /embed/<id>, /v/<id>, /live/<id>
      const m = path.match(/^\/(?:shorts|embed|v|live)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }

  if (!id || !VIDEO_ID_RE.test(id)) return null;
  return buildRef(id);
}

function buildRef(videoId: string): YouTubeRef {
  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}
