# Inwentaryzacja Stadionowa — Frontend

Mobile-first frontend (React + Vite + Tailwind CSS) dla aplikacji do inwentaryzacji stadionowej.

## Ngrok — jeden tunel wystarczy

Frontend i backend działają na osobnych portach (5173 i 8080). Zapytania API idą przez **proxy Vite** — React woła `/api/...`, a Vite przekazuje je do Javy na `localhost:8080`.

Dzięki temu wystarczy **jeden Ngrok** na frontend:

```bash
ngrok http 5173
```

Nie trzeba osobnego tunelu dla backendu ani ustawiać publicznego adresu API w `.env`.

## Uruchomienie

1. Uruchom backend (Java) — port `8080`
2. Uruchom frontend:

```bash
npm install
npm run dev
```

3. Odpal Ngrok:

```bash
ngrok http 5173
```

4. Wejdź na link z Ngroka na telefonie lub komputerze.

Po zmianie `vite.config.js` zrestartuj `npm run dev`.

## Widoki

- `/` — wybór pracownika (`GET /api/workers`)
- `/inventory/:worker` — liczenie produktów (`GET /api/products?worker=`, `POST /api/inventory`)
- `/admin` — panel koordynatora, pobieranie CSV (`GET /api/export`)
