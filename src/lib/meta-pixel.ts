// Helpers do Meta Pixel (fbq). O script base é injetado pelo <MetaPixel /> no layout.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export type MetaStandardEvent =
  | "PageView"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "ViewContent";

/**
 * Dispara um evento padrão do Meta Pixel. No-op se o pixel não estiver
 * configurado/carregado (ex.: dev local sem NEXT_PUBLIC_META_PIXEL_ID).
 *
 * `eventId` habilita deduplicação no Meta (entre reloads do browser e,
 * futuramente, com a Conversions API server-side).
 */
export function fbqTrack(
  event: MetaStandardEvent,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) {
    window.fbq("track", event, params ?? {}, { eventID: eventId });
  } else {
    window.fbq("track", event, params ?? {});
  }
}
