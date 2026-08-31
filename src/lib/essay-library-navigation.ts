export function essayLibraryPath(pathname: string, topic: string, source: string) {
  const params = new URLSearchParams();
  if (topic !== "all") params.set("topic", topic);
  if (source !== "all") params.set("source", source);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
