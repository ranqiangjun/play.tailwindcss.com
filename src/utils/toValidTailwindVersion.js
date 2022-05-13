export function toValidTailwindVersion(value, defaultVersion = '3') {
  if (['0', '1', '2', '3'].includes(value)) return value
  return defaultVersion
}
