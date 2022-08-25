export function toValidTailwindVersion(value, defaultVersion = '3') {
  if (['1', '2', '3', 'insiders'].includes(value)) return value
  return defaultVersion
}
