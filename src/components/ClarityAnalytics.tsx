"use client";

import Script from "next/script";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

/**
 * Microsoft Clarity — heatmaps, session recordings, rage/dead clicks.
 * SPA-aware nativo (rastreia navegação client-side sozinho).
 * No-op se NEXT_PUBLIC_CLARITY_ID não estiver setado (dev/preview).
 */
export function ClarityAnalytics() {
  if (!CLARITY_ID) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");`}
    </Script>
  );
}
