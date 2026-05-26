export function truncate(input: string, max: number): { text: string; truncated: boolean } {
  if (input.length <= max) {
    return { text: input, truncated: false };
  }
  return { text: `${input.slice(0, max).trimEnd()}…`, truncated: true };
}
