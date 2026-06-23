// Base path the app is served under (e.g. "/clientside-containers" on GitHub
// Pages, "" elsewhere). Inlined at build time via next.config `env`.
//
// Use this only for raw asset/URL references that Next does NOT rewrite
// automatically — Web Workers, service workers, and iframe `src`. For
// next/link and next/image, the basePath is applied by the framework, so do
// NOT prepend BASE_PATH there or it will be duplicated.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
