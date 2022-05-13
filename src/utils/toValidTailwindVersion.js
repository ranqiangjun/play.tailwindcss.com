export function toValidTailwindVersion(value, defaultVersion = '3') {
  if (['insiders', '1', '2', '3'].includes(value)) return value
  return defaultVersion
}
