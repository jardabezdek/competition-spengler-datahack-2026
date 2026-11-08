export function formatPlusMinus(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
