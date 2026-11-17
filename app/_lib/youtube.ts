export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    let id: string | null = null;
    if (url.hostname === "youtu.be")
      id = url.pathname.match(/^\/([\w-]{11})\/?$/)?.[1] ?? null;
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : (url.pathname.match(
              /^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/,
            )?.[1] ?? null);
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
