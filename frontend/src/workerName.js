export function formatWorkerFull(worker) {
  if (!worker) {
    return ''
  }
  return (worker.firstName + ' ' + worker.lastName).trim()
}

export function formatWorkerShort(worker) {
  if (!worker) {
    return ''
  }
  const lastInitial = worker.lastName ? worker.lastName.charAt(0) + '.' : ''
  return (worker.firstName + ' ' + lastInitial).trim()
}

export function workerMatchesSearch(worker, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }
  return (
    worker.firstName.toLowerCase().includes(normalized) ||
    worker.lastName.toLowerCase().includes(normalized) ||
    formatWorkerFull(worker).toLowerCase().includes(normalized)
  )
}
