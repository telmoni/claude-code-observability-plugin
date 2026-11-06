/** Lengths and cuts in characters, as ingest's caps count them: a cut never splits a character's two halves. */

function pairAt(text: string, index: number): boolean {
  const high = text.charCodeAt(index);
  const low = text.charCodeAt(index + 1);
  return high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff;
}

/** The first `max` characters of `text`. */
export function cut(text: string, max: number): string {
  let end = 0;
  for (let count = 0; count < max && end < text.length; count++) {
    end += pairAt(text, end) ? 2 : 1;
  }
  return text.slice(0, end);
}

/** Whether `text` holds at most `max` characters. */
export function within(text: string, max: number): boolean {
  return text.length <= max || cut(text, max).length === text.length;
}
