/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).host : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // sharp tem binário nativo — externaliza pra não ser empacotado pelo bundler.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Upload de foto manda o arquivo cru (até 5 MB) pro server action; o default
      // de 1 MB rejeitaria. Folga pra cobrir o arquivo + overhead do FormData.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
