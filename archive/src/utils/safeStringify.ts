export function safeStringify(obj: any): string {
  try {
    const seen = new WeakSet<any>();
    return JSON.stringify(obj, function (_key, value) {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    });
  } catch {
    try { return String(obj); } catch { return '[object Object]'; }
  }
}
