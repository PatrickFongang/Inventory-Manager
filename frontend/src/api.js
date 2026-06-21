const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' }

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error('Błąd serwera (' + response.status + ')')
  }
  return response
}

export async function fetchWorkers() {
  const response = await fetch('/api/workers', {
    headers: NGROK_HEADERS,
  })
  await handleResponse(response)
  return response.json()
}

export async function fetchProducts(worker) {
  const url = '/api/products?worker=' + encodeURIComponent(worker)
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
