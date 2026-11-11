export function mulberry32(seed: number): () => number {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function fisherYates<T>(values: T[], rnd: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(rnd() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
