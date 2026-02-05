import type { Account } from '../types/account'

export function labelsToArray(labels: string) {
  const obj: Record<string, Account['labels'][number]> = {}
  const splitted = labels
    .split(';')
    .map((l) => l.trim())
    .filter(Boolean)

  for (const text of splitted) obj[text] = { text }
  return Object.values(obj)
}
