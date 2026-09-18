# Studio 3D — anteprima agenda

Nuova scena indipendente: `/office/studio.html`. Non è stata pubblicata su Vercel.
La precedente agenda CSS in finestra è stata scollegata dall’ufficio.

## Implementato
- Stanza, scrivania, finestra, persiane, sedia, lampada, computer e agenda in geometria 3D.
- Copertina incernierata all’agenda. Il libro mantiene la sua posizione sulla scrivania.
- Camera con accelerazione/decelerazione continua, ritorno alla vista della stanza.
- Foglio deformabile mediante integrazione delle tangenti; dorso fisso, curvatura lungo il foglio e rilascio smorzato. Non una simulazione FEM della carta.
- Sfoglio trascinando sulla pagina, pulsanti o frecce della tastiera; apertura cliccando sul volume 3D o sul comando accessibile.
- Luce direzionale, ombre, materiali PBR, legno con mappe diffuse/normal/roughness; bordi smussati, cuciture, spessore dei fogli.
- Tenda, lettera, vapore e polvere in movimento; modalità movimento ridotto e pausa quando la scheda non è visibile.
- Scadenze dal motore esistente e dal wallet cloud quando autenticati. Nessuna scrittura ai dati finanziari.
- Note disegnate sulla pagina e salvate soltanto nel browser, separate per account. Anteprima non autenticata priva di dati personali.

## Limiti da tenere espliciti
È un prototipo tridimensionale funzionante, non una resa iperrealistica finale. Gli arredi sono costruiti proceduralmente; per il livello fotografico richiesto restano da rifinire modelli, materiali, illuminazione indiretta e regia. Solo l’agenda è interattiva in questo studio; gli altri oggetti sono parte del set. Il login sulla soglia e le altre operazioni restano nell’esperienza già pubblicata.

## Risorse
- Three.js 0.180.0, RoomEnvironment e RoundedBoxGeometry: MIT, licenza in office/vendor/LICENSE-three.txt.
- Legno Wood Table 001, Poly Haven: https://polyhaven.com/a/wood_table_001 — CC0. Mappe 2K ottenute dall’API pubblica Poly Haven.
- Carta, pelle, stampa e tappeto: texture procedurali locali, nessuna generazione a pagamento.

## Verifiche
- 82 test passati, inclusi vincolo del dorso, non penetrazione del foglio nel piano, convergenza della molla a più frequenze e velocità della camera agli estremi.
- Apertura, cambio pagina, scrittura e vista d’insieme controllati nel browser.
- Controllo mobile a 390 px; la camera viene allontanata per contenere il volume aperto.
- L’anteprima isolata usa il provider cloud di prova. Nessun dato finanziario reale è stato modificato.

## Raffinamento materiali e gesti
- Aggiunti materiali fotografici Brown Leather e Painted Plaster Wall, CC0 Poly Haven: https://polyhaven.com/a/brown_leather e https://polyhaven.com/a/painted_plaster_wall.
- Aggiunti modelli Desk Lamp Arm 01 e Mid Century Lounge Chair (mappe 1K), CC0 Poly Haven: https://polyhaven.com/a/desk_lamp_arm_01 e https://polyhaven.com/a/mid_century_lounge_chair.
- Ombre di contatto SSAO nella vista desktop; percorso più leggero su telefono.
- Piccola curvatura a riposo della carta, protezione contro clic sulle geometrie nascoste, rilascio basato sul gesto dell’utente anziché sul ritardo della molla.
- Appunti e dati visibili vengono svuotati se cambia l’account.
- La pagina di risguardo è figlia della cerniera: segue la copertina. Chiudendo dalla pagina delle note, il foglio viene riportato a destra prima della chiusura.
- Verificati nel browser anche trascinamento rapido e sequenza completa di richiusura; nessun errore JavaScript rilevato.
- Anteprima di lavoro corrente: http://localhost:4182/office/studio.html (server locale; porta precedente non affidabile).
