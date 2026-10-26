export function catalog<const T extends Record<string, string>>(es: T, en: { [K in keyof T]: string }) {
  return { es, en };
}
