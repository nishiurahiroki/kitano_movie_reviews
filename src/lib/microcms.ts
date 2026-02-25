type Film = {
  id: string;
  slug: string;
  title: string;
  releaseDate: string;
};

type Review = {
  id: string;
  body?: string;
  film: Film;
};

const domain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

function assertEnv() {
  if (!domain || !apiKey) {
    throw new Error("Missing microCMS env vars. Check .env");
  }
}

async function microCMSGet<T>(
  endPoint: string,
  query?: Record<string, string>,
) {
  assertEnv();

  const url = new URL(`https://${domain}.microcms.io/api/v1/${endPoint}`);
  if (query)
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "X-MICROCMS-API-KEY": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`microCMS fetch failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

export async function fetchAllFilsm(): Promise<Film[]> {
  const data = await microCMSGet<{ contents: Film[] }>("films", {
    limit: "100",
  });
  return data.contents;
}

export async function fetchPublishedReviews(): Promise<Review[]> {
  const data = await microCMSGet<{ contents: Review[] }>("reviews", {
    limit: "100",
  });
  return data.contents;
}
