export function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
