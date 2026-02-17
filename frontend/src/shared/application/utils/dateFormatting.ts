export function timeAgo(dateString: string | null): string {
  if (!dateString) return 'at some point'
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now.getTime() - past.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return '1 month ago'
  if (diffMonths <= 12) return `${diffMonths} months ago`
  const diffYears = Math.floor(diffDays / 365)
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
}

export function formatFullDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US'
  return date.toLocaleString(browserLocale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
