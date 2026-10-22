export function rutaInterna(url?: string): string | undefined {
  if (!url || !url.startsWith('/') || url.startsWith('//') || /[\\\s\u0000-\u001f]/.test(url)) {
    return undefined;
  }
  return /^\/login(?:[/?#]|$)/.test(url) ? undefined : url;
}
