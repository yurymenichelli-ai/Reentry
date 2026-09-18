# Verifica del redesign — 15 settembre 2026

## Implementazione

Temi Lumi Editoriale e Notturno Materico per Home, Piano, Movimenti, Analisi, onboarding, accesso e finestre di inserimento. Preferenza chiaro/scuro/sistema persistente, navigazione compatta, ricerca movimenti, gestione del focus e riduzione delle animazioni. Il motore finanziario e il modulo cloud rimangono invariati.

La Home riprende la composizione delle tavole di riferimento: capitale, nota cartacea, due metriche e avanzamento convivono nello stesso foglio; il prossimo accredito e le scadenze seguono subito sotto. I due temi mantengono geometria e gerarchia identiche e cambiano soltanto materiale, contrasto e fotografia dell’accesso. L’ingresso della pagina, la linea del titolo, il progresso, la nota e i controlli usano animazioni coordinate basate su trasformazione e opacità.

Corretti anche il salvataggio degli obiettivi (un campo chiamato `id` nascondeva l'identificatore del modulo), lo scope del profilo remoto dopo il login e il testo dell'analisi senza storico.

## Verifiche

- 74 test automatici superati, inclusi regressione del salvataggio obiettivi, preferenza tema e integrità delle risorse offline.
- 24 combinazioni di quattro sezioni, due temi e larghezze 320, 390 e 1280 px: nessuno sforamento orizzontale.
- Provati nell'interfaccia: onboarding, capitale, entrate, spese ricorrenti, debito, piano, obiettivo, movimento, ricerca, cambio tema, persistenza dopo ricarica, chiusura finestre e ripristino del focus.
- Controllate visivamente Home, Piano, Analisi e accesso sui formati mobile e desktop.

## Limiti

L'anteprima locale usa dati di prova inseriti attraverso l'interfaccia. Il server statico locale non espone la configurazione Supabase: verificato il messaggio di indisponibilità, ma l'accesso a un account reale richiede l'ambiente configurato. Non è stato eseguito un test completo della navigazione senza rete. Nessuna pubblicazione su Vercel e nessuna modifica ai dati cloud.

## Immagini dell'accesso

Fotografie create con la generazione immagini integrata e convertite in JPEG ottimizzati:

- `assets/lumi-editoriale.jpg`: scrivania italiana in legno, tazza ceramica, quaderno, penna e ramo d'ulivo; luce naturale calda e intonaco beige, fotografia verticale senza testo o interfaccia.
- `assets/notturno-materico.jpg`: scrivania notturna con tazza scura, libri, quaderno e penna; luce calda localizzata, parete carbone petrolio, fotografia verticale senza testo o interfaccia.

Le fotografie sono sfondi dell'app; non sostituiscono controlli o contenuti interattivi.
