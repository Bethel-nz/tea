export function parseRoute(
  route: string,
  params?: Record<string, string | number>
): string {
  if (!params) return route;

  return Object.entries(params).reduce(
    (url, [key, value]) =>
      url.replace(`:${key}`, encodeURIComponent(String(value))),
    route
  );
}

export function appendQueryParams(
  url: URL,
  query?: Record<string, unknown>
): void {
  if (!query) return;

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
}
