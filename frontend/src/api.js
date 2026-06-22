const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' }

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error('Błąd serwera (' + response.status + ')')
  }
  return response
}

export async function fetchWorkers(search) {
  let url = '/api/workers'
  if (search) {
    url += '?search=' + encodeURIComponent(search)
  }
  const response = await fetch(url, {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return response.json()
}

export async function createWorker(firstName, lastName) {
  const response = await fetch('/api/workers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify({ firstName, lastName }),
  })
  await handleResponse(response)
  return response.json()
}

export async function updateWorkerWorkingToday(workerId, workingToday) {
  const response = await fetch('/api/workers/' + workerId + '/working-today', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify({ workingToday }),
  })
  await handleResponse(response)
  return response.json()
}

export async function resetWorkersWorkingToday() {
  const response = await fetch('/api/workers/reset-working-today', {
    method: 'POST',
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return true
}

export async function deleteWorker(workerId) {
  const response = await fetch('/api/workers/' + workerId, {
    method: 'DELETE',
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return true
}

export async function fetchSections(activeOnly) {
  let url = '/api/sections'
  if (activeOnly) {
    url += '?activeOnly=true'
  }
  const response = await fetch(url, {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return response.json()
}

export async function updateSectionWorkers(sectionId, workerIds) {
  const response = await fetch('/api/sections/' + sectionId + '/workers', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify(workerIds),
  })
  await handleResponse(response)
  return response.json()
}

export async function fetchProducts(workerId, pendingOnly) {
  let url = '/api/products?workerId=' + workerId
  if (pendingOnly !== undefined) {
    url += '&pendingOnly=' + pendingOnly
  }
  const response = await fetch(url, {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return response.json()
}

export async function submitInventory(entries) {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify(entries),
  })
  await handleResponse(response)
  return true
}

export async function saveDraft(entry) {
  const response = await fetch('/api/inventory/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify(entry),
  })
  await handleResponse(response)
  return response.json()
}

export async function updateInventoryEntry(entryId, quantity) {
  const response = await fetch('/api/inventory/' + entryId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify({ quantity }),
  })
  await handleResponse(response)
  return response.json()
}

export async function adminSaveProduct(productId, quantity) {
  const response = await fetch('/api/inventory/product/' + productId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
    },
    body: JSON.stringify({ quantity }),
  })
  await handleResponse(response)
  return response.json()
}

export async function fetchAdminOverview() {
  const response = await fetch('/api/admin/overview', {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return response.json()
}

export async function fetchSectionProducts(sectionId) {
  const response = await fetch('/api/admin/sections/' + sectionId + '/products', {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return response.json()
}

export async function downloadExport() {
  const response = await fetch('/api/export', {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'inventory.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function resetInventory() {
  const response = await fetch('/api/inventory', {
    method: 'DELETE',
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return true
}
