# Rientro — Ufficio cinematografico

Nuova esperienza separata in `/office/`. L'app classica rimane alla radice.

## Esperienza
Soglia con login reale Supabase, riconoscimento della sessione già esistente, password visibile su richiesta, creazione account e conferma email. Nessun iframe finanziario viene caricato prima dell'accesso.

Ingresso: avvicinamento alla porta, stacco di montaggio e ingresso nell'ufficio. La scena usa fotografie generate con imagegen, una camera prospettica Three.js e particelle discrete. È un ambiente fotografico 2.5D con riprese guidate, non un modello 3D a esplorazione libera. La geometria completa, una porta fisicamente articolata e animazioni delle tende non sono incluse.

Sette oggetti:
- Bacheca: Home e disponibile.
- Fascicoli: debiti e Piano.
- Computer: movimenti e spese future.
- Calendario: scadenze della Home.
- Tavolo dei progetti: obiettivi nel Piano.
- Report: Analisi.
- Agenda: Profilo.

Ogni oggetto avvicina la camera e apre la vera app in un pannello leggibile. Dati, calcoli, persistenza e operazioni continuano ad appartenere all'app esistente. Comunicazione tramite un bridge che accetta soltanto messaggi dall'origine e dalla finestra genitore previste, e controlla l'autenticazione prima di ogni navigazione.

Audio sintetico facoltativo e inizialmente spento. Preferenza per movimento ridotto, rispetto di `prefers-reduced-motion`, ingresso saltabile, navigazione rapida e trascinamento laterale della scena. Fallback fotografico senza WebGL. Rendering limitato a circa 30 fps e pixel ratio 1.7; rendering e audio sospesi quando la scheda è nascosta.

## Verifiche
78 test passati, inclusi 3 test del bridge: origine/finestra, autenticazione mancante e azioni non ammesse. Nel browser, con adattatore cloud fittizio isolato fuori dal repository pubblicato: login, ingresso, tutte le sette destinazioni, creazione di una spesa, chiusura pannelli, movimento ridotto, sessione di ritorno e logout con rimozione dell'iframe. Controllate larghezze 320/390/768/1440 senza overflow nella soglia. Nessuna credenziale reale usata nel collaudo, nessuna scrittura nel wallet cloud.

## Asset e provenienza
Fotografie create con il generatore integrato imagegen, convertite in JPEG:
- `office/assets/studio.jpg`
- `office/assets/threshold.jpg`
Three.js 0.180.0 distribuito localmente con licenza MIT in `office/vendor/LICENSE-three.txt`. Documentazione tecnica: https://threejs.org/docs/

Prompt studio:
Create a single ultra photorealistic cinematic architectural interior photograph, wide landscape 1536x1024. An exquisite lived-in Italian private office, contemporary Mediterranean meets mid-century detective study, warm ivory textured plaster, walnut, muted deep petrol accents, late afternoon dramatic natural light. Camera just inside doorway, eye level, wide 28mm lens, looking at a real office. Detailed composition: left wall large cork pinboard with cream blank notes and small pinned photographs at x20% y35%; central heavy walnut desk at x50% y65%, leather desk mat and visible manila paper folders toward left side of desk at x40% y66%; desktop computer with dark blank screen on right side of desk at x61% y47%; cream calendar on back wall at x46% y32%; low side table at far right x82% y67% with travel postcards and small architectural model; leather personal agenda at front right of desk x68% y73%; printed financial report with simple unlabeled graphs at front center x50% y78%. Right side large window, linen curtain, olive tree, light and long shadows, outside historic European rooftops. Highly realistic subtle dust in sunbeam, tactile paper and timber, film grain, restrained cinematic color grading, natural imperfect arrangement, upscale film set. Wide readable room with objects clearly distinct and large enough to click. No people, no readable text, no logos, no lettering, no app UI, no frames, no collage. Entire frame is photograph.

Prompt soglia:
Single photorealistic cinematic architectural photograph, landscape 1536x1024. Camera in a quiet upscale old Roman palazzo corridor facing the closed door of a private office. Composition: door occupies right half, x60 to88%; left half dark olive petrol textured plaster wall with ample negative space for ivory website login text. Door tall solid dark walnut frame with ribbed fluted translucent glass panels, warm amber light from room behind the glass but NO visible contents, brass lever handle and small blank brass plaque. Pale travertine door frame, terrazzo floor bottom, small warm wall sconce upper right, late evening. Strong cinematic practical light, deep velvety shadows, tactile aged materials, film grain, architectural editorial photography, subtly mysterious sophisticated atmosphere. Color palette deep petrol, walnut, burnished brass, warm stone. No people, no lettering, no text, no logos, no UI, no collage, no frames. Real film still.
