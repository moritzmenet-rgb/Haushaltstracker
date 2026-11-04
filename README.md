# Fish & Wish

Gamifizierter Familien-Haushaltsmanager (PWA) mit Aufgaben & Punkten, Abzeichen, Pinnwand und Menüplanung.

- **Live:** https://moritzmenet-rgb.github.io/Haushaltstracker/
- **Frontend:** React + TypeScript + Vite + Tailwind, gehostet auf GitHub Pages
- **Backend:** Firebase (Google-Login + Cloud Firestore), Projekt `finaldatabase-46da8`

## Lokal starten

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen. **Achtung:** Auch lokal ist die App mit der echten Datenbank verbunden.

## Veröffentlichen

Jeder Push auf `main` prüft die Typen, baut die App über GitHub Actions (`.github/workflows/deploy.yml`) und veröffentlicht sie auf GitHub Pages.

## Datensicherung

```bash
npm run backup -- "<Zielordner>"
```

Öffnet eine lokale Seite auf http://localhost:5055. Nach dem Google-Login werden alle Haushaltsdaten (nur lesend) als JSON gespeichert. Ohne Zielordner landen sie in `backups/`, das von Git ignoriert wird. Backups enthalten persönliche Daten, also **nie committen**.

## Struktur

- `src/context/AppContext.tsx`: zentraler App-State und Firestore-Echtzeit-Sync
- `src/services/firestoreSync.ts`: Schreibzugriffe auf Firestore
- `src/components/`: UI (Dashboard, Aufgaben, Pinnwand, Menüplaner, Admin)
- `src/version.ts`: Versionsnummer und „Was ist neu?“-Texte
- `firestore.rules`: Sicherheitsregeln der Datenbank
- `tools/backup/`: Backup-Werkzeug
