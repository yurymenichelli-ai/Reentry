# Verifica — 17 settembre 2026

Riferimento visuale: tavola del 17 settembre, 14:45:38, presente nei Download. Confrontate composizione fotografica e palette Home, anello Analisi, registro Movimenti, tipografia Piano e materiali dei moduli.

- 75 test esistenti passati dopo le modifiche.
- 66 combinazioni verificate: 11 schermate/stati × 2 temi × 320/390/1280 px. Nessun overflow orizzontale rilevato né elementi oltre il viewport.
- Controllo visuale tramite browser su Home chiara e scura mobile, Home desktop, Analisi mobile e desktop, Piano mobile, Profilo scuro e Movimenti scuri.
- Ambiente di verifica separato con copie dei renderer e un adattatore cloud simulato, senza collegamenti ai dati dell'utente. Provati navigazione, cambio tema, apertura/chiusura moduli, creazione di un obiettivo, salvataggio di un movimento e ricerca del movimento.
- Ulteriori 42 controlli dopo le correzioni, inclusi nomi lunghi, Home senza capitale, analisi e movimenti vuoti e metodo 50/30/20; nessun overflow.
- Fotografie convertite in JPEG (681 KB chiara, 346 KB scura) per contenere il peso.
- App reale avviata localmente sulla porta 4173. Verificati l'accesso visivo e il cambio tema, senza inviare credenziali.

Limitazioni: nessun accesso reale, scrittura cloud o test completo offline. Nessun deploy. Obiettivi e Profilo conservano la collocazione e i flussi esistenti; il mockup guida lo stile senza introdurre funzioni inesistenti.
