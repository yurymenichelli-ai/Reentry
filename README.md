# Rientro

Demo mobile-first per pianificare il rientro da uno o più debiti senza collegamento bancario.

## Avvio

Richiede solo Python 3 (preinstallato su macOS):

```bash
npm start
```

Apri poi <http://localhost:4173>.

La prima apertura avvia l’onboarding. I dati esistenti del browser vengono conservati.

## Test

```bash
npm test
```

I dati sono salvati nel `localStorage` del browser; negli ambienti configurati è disponibile anche l’accesso e la sincronizzazione con Supabase. Il server statico locale non espone `/api/supabase-config`. Le stime non sono consulenza finanziaria e non includono interessi o penali non inseriti.

## Installazione come app (PWA)

La demo include manifest, icone e funzionamento offline. Per installarla su un telefono deve essere pubblicata con HTTPS (oppure eseguita su `localhost` durante lo sviluppo).

- iPhone/iPad: aprire l'indirizzo HTTPS in Safari, poi **Condividi → Aggiungi alla schermata Home**.
- Android: aprire l'indirizzo HTTPS in Chrome e scegliere **Installa app**.

## Redesign

Temi Lumi Editoriale e Notturno Materico, selezionabili dalle impostazioni. Specifiche in [docs/DESIGN.md](docs/DESIGN.md); verifiche e limiti in [docs/VERIFICA-REDESIGN.md](docs/VERIFICA-REDESIGN.md).
