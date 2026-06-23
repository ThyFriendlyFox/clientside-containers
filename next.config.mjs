// Static export (for the GitHub Pages demo) is enabled with STATIC_EXPORT=true.
// In that mode the app has no server: /api/* calls are served in the browser by
// the demo backend (see components/DemoBridge.tsx). For normal server builds the
// API route handlers are used and none of the export options apply.
const isExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.PAGES_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
      }
    : {}),
};

export default nextConfig;
