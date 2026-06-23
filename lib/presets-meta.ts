// Client-safe preset metadata (no policy-transform functions, no yaml import).
export interface PresetMeta {
  id: string;
  label: string;
  description: string;
}

export const PRESET_META: PresetMeta[] = [
  {
    id: "github-readonly",
    label: "GitHub API (read-only)",
    description: "Allow curl to GET from api.github.com. Write methods are blocked at L7.",
  },
  {
    id: "npm-registry",
    label: "npm registry",
    description: "Allow node/npm to fetch packages from registry.npmjs.org.",
  },
  {
    id: "pypi",
    label: "PyPI",
    description: "Allow python/uv to install packages from pypi.org and files.pythonhosted.org.",
  },
  {
    id: "anthropic-inference",
    label: "Routed inference (Anthropic)",
    description: "Route api.anthropic.com through the privacy router with managed credentials.",
  },
];
