# Rientro — editoriale architettonico

## Riferimento e audit
Tavola principale: `Immagine Codex 17 set 2026, 14_45_38.png`, recuperata dai Download. Mostra Home fotografica in pietra, Piano, Movimenti, Analisi con anello, Obiettivi e Profilo in chiaro e scuro. Sostituisce il vincolo Lumi dei concept precedenti.

Stack: applicazione JavaScript nativa, template in `app.js`, motore in `engine.js`, cloud in `cloud.js`; CSS legacy in `styles.css` e sistema semantico in `editorial.css`. Il precedente foglio editoriale conteneva più direzioni sovrapposte (Georgia/IBM Plex, foglietti, percorso verticale, card e animazioni). Rimossi i blocchi di art direction concorrenti; conservata la base delle forme e dei controlli già verificati.

## Tokens
| Ruolo | Chiaro | Scuro |
|---|---|---|
| Fondo | `#f4f0e6` | `#0c191b` |
| Superficie | `#faf7ef` | `#122326` |
| Superficie secondaria | `#e9e4d8` | `#1c3031` |
| Testo | `#102f32` | `#f4efe2` |
| Testo secondario | `#465a57` | `#c1ccc5` |
| Accento | `#164e50` | `#a0cec1` |
| Filetti | `#d7d3c6` | `#2c4243` |

Georgia per titoli e cifre editoriali, IBM Plex Sans per controlli e testo, fallback locali. Importi tabulari. Scala: titoli 32–56 px, cifra principale 36–77 px secondo contesto, sezioni 24–30 px, testo 14–16 px, metadati 11–13 px. Spaziatura 4/8/12/16/24/32/48/64. Contenuto desktop 1120 px, mobile massimo 560 px. Controlli raggio 4 px, dialoghi 8 px; soltanto il foglio sovrapposto alla fotografia ha spalle 20–24 px. Liste senza contenitori individuali.

Icone SVG esistenti con tratto 1.5, niente nuova libreria. Focus 2 px e offset 4 px. Navigazione 12, dialoghi 20, feedback 30. Motion: controlli 160 ms, tema 220 ms, pannelli 280 ms; riduzione movimento rispettata. Conservate le animazioni numeriche esistenti.

## Applicazione
- Home: fotografia di architettura, titolo sovrapposto, foglio di riepilogo e anello del mese; desktop con registro scadenze a lato. Importi e significati rimangono quelli calcolati dall'app, non quelli illustrativi del mockup.
- Piano: sezioni aperte e confronti separati da filetti, gerarchia serif, fotografia a chiusura degli obiettivi.
- Movimenti: registro, ricerca, entrate e spese ricorrenti, azioni esistenti conservate.
- Analisi: anello SVG calcolato dalle categorie reali, palette condivisa con i grafici per categoria; nessun anello fittizio se mancano dati.
- Obiettivi: elenco e moduli esistenti nel Piano; nessuna nuova rotta o funzione simulata.
- Profilo: impostazioni esistenti, temi Chiaro/Scuro/Sistema, superfici e moduli comuni.
- Login e onboarding: architettura fotografica con testo e controlli nativi; selezione tema disponibile anche all'accesso.

## Fotografie
Generate con lo strumento integrato imagegen, salvate in `assets/architecture-light.jpg` e `assets/architecture-dark.jpg` e incluse nella cache offline. Nessun testo o UI dentro le immagini.

Prompt light: fotografia architettonica editoriale verticale, villa mediterranea modernista in pietra calcarea avorio, parapetto diagonale e gradini in travertino, ulivo e ombre nette, luce pomeridiana, area superiore sinistra libera per testo; niente persone, testi, cornici, collage o interfacce.

Prompt dark: fotografia architettonica editoriale verticale della terrazza di una villa mediterranea notturna, parete e scala in pietra a destra, ombre antracite/petrolio, luce calda da porta incassata, sagoma d'ulivo e mare notturno; parte superiore sinistra scura libera per testo; niente persone, testi, cornici, collage o interfacce.

## Confini
Motore, formule, sincronizzazione, autenticazione, persistenza e routing conservati. Nessuna pubblicazione inclusa. Controlli presenti soltanto nel mockup, come metodi di pagamento o notifiche, non vengono inventati.
