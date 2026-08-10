# Rientro

Demo mobile-first per pianificare il rientro da uno o più debiti senza collegamento bancario.

## Avvio

Richiede solo Python 3 (preinstallato su macOS):

```bash
npm start
```

Apri poi <http://localhost:4173>.

La prima apertura mostra dati demo. Per provare l'onboarding, apri la console del browser ed esegui:

```js
localStorage.clear(); location.reload();
```

## Test

```bash
npm test
```

I dati sono salvati solo nel `localStorage` del browser. Le stime non sono consulenza finanziaria e non includono interessi o penali non inseriti.

## Installazione come app (PWA)

La demo include manifest, icone e funzionamento offline. Per installarla su un telefono deve essere pubblicata con HTTPS (oppure eseguita su `localhost` durante lo sviluppo).

- iPhone/iPad: aprire l'indirizzo HTTPS in Safari, poi **Condividi → Aggiungi alla schermata Home**.
- Android: aprire l'indirizzo HTTPS in Chrome e scegliere **Installa app**.
