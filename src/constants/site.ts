const DEFAULT_SITE_URL = "https://gugnir-console.example.com";

function normalizeSiteUrl(value: string | undefined) {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const siteOrigin = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL);
export const siteUrl = new URL(siteOrigin);
