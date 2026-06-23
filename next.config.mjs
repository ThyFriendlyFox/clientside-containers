// Static export (for GitHub Pages) is enabled with STATIC_EXPORT=true.
// In that mode the app has no server: ClientsideProvider handles /api/* in
// the browser with IndexedDB persistence and Web Worker / WebContainer runtimes.
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
