# Handoff Spec: Rientro — “Rotta calma”

## Overview

Rientro è una PWA italiana mobile-first per persone che vogliono capire quanto possono spendere e rientrare dai debiti senza sacrificare la vita quotidiana. La singola priorità dell’interfaccia è rendere evidente, in meno di cinque secondi, cosa è disponibile oggi e perché.

La firma visiva è la **rotta del mese**: indicatori, timeline e progressi usano una linea continua con tappe, presa dal linguaggio di un diario di bordo. È applicata con misura; il resto dell’interfaccia rimane quieto.

## Layout

- `layout-mobile`: una colonna, larghezza fluida, padding laterale `space-page-mobile`, contenuto fino a `content-mobile-max`.
- `layout-tablet`: una colonna larga con widget secondari a due colonne.
- `layout-desktop`: sidebar `sidebar-width`, contenuto massimo `content-max`, griglia widget 12 colonne.
- La navigazione mobile resta raggiungibile con una mano e rispetta `safe-area-inset-bottom`.
- Il primo elemento della Home è il saldo; il secondo è il widget del ritmo; calendario e piano seguono in ordine di urgenza.

## Design Tokens Used

| Token | Value | Usage |
|---|---:|---|
| `color-canvas` | `#F1F5F4` | Sfondo generale freddo e luminoso |
| `color-surface` | `#FFFFFF` | Card e modali |
| `color-ink` | `#102F36` | Testo principale |
| `color-muted` | `#687D80` | Testo secondario, mai per dati essenziali |
| `color-route` | `#2E746F` | CTA, stato attivo, dati positivi |
| `color-route-soft` | `#DDECE7` | Selezioni e superfici informative |
| `color-depth` | `#123F49` | Hero e widget prioritari |
| `color-coral` | `#BB684B` | Uscite, attenzione, mai decorativo |
| `color-line` | `#DCE5E2` | Separatori |
| `radius-sm` | `12px` | Controlli compatti |
| `radius-md` | `18px` | Sottowidget |
| `radius-lg` | `28px` | Card principali |
| `radius-nav` | `30px` | Navigazione mobile |
| `space-page-mobile` | `16px` | Margine pagina iPhone |
| `space-card-mobile` | `20px` | Padding card mobile |
| `space-card-desktop` | `30px` | Padding card desktop |
| `shadow-card` | `0 12px 36px rgba(19,55,61,.07)` | Sollevamento card |
| `shadow-float` | `0 18px 48px rgba(13,43,49,.16)` | Nav e sheet |
| `font-display` | `-apple-system, BlinkMacSystemFont, "SF Pro Display"` | Titoli e cifre |
| `font-body` | `-apple-system, BlinkMacSystemFont, "SF Pro Text"` | Testi e controlli |
| `motion-standard` | `220ms cubic-bezier(.2,.8,.2,1)` | Hover, press, espansioni |
| `motion-enter` | `480ms cubic-bezier(.16,1,.3,1)` | Entrata coordinata della pagina |

## Components

| Component | Variant | Props | Notes |
|---|---|---|---|
| `BalanceHero` | configured / empty | totale, conto, contanti, previsione | Il totale domina; il dettaglio è progressivo |
| `SpendableWidget` | ready / incomplete | giornaliero, settimanale, payday, spiegazione | Prima il ritmo, poi la formula espandibile |
| `RouteTimeline` | income / expense / plan | data, etichetta, importo, stato | Linea verticale e tappe; massimo 6 voci in Home |
| `MetricTile` | neutral / positive / commitment | label, amount | Dati allineati a destra, cifre tabulari |
| `PlanCard` | prudent / balanced / fast / unavailable | quota, restaPerVivere, durata | “Resta per vivere” sostituisce “margine residuo” |
| `FloatingNav` | active / inactive / add | icon, label | Materiale satinato; CTA centrale separata |
| `BottomSheet` | default / error / destructive | title, fields, primaryAction | Altezza massima 92dvh; CTA sempre visibile |
| `Toast` | success / neutral / error | message | `role=status`, non blocca il flusso |

## States and Interactions

| Element | State | Behavior |
|---|---|---|
| Card | Hover desktop | Sale di 2px, ombra leggermente più profonda |
| Card | Press mobile | Scala a `.99`, ritorno elastico |
| CTA | Hover | Aumenta luminosità, non cambia dimensione |
| CTA | Press | Scala a `.97` per 100ms |
| Nav item | Active | Pill morbida, icona e label diventano `color-ink` |
| Details | Open | Contenuto entra con opacità e traslazione 6px |
| Timeline item | New | Tappa appare dopo la linea, ritardo progressivo 45ms |
| Form field | Focus | Anello 3px `color-route-soft`, bordo `color-route` |
| Form | Error | Bordo corallo e messaggio specifico sotto il campo |
| Button | Disabled/loading | Opacità .55, interazione bloccata, label invariata |

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| `> 1024px` | Sidebar fissa; contenuto max 1180px; griglie 2–3 colonne |
| `801–1024px` | Sidebar compatta; widget principali a una colonna |
| `≤ 800px` | Bottom navigation; card full-width; sheet dal basso |
| `≤ 390px` | Tipografia ridotta di un livello; importi non vanno a capo; CTA full-width nei modali |

## Content Specifications

- Titoli card: massimo 42 caratteri; oltre, andare a capo senza ellissi.
- Nomi movimento: massimo 60 caratteri; in lista massimo 2 righe.
- Importi: cifre tabulari, mai spezzati; migliaia con punto, euro in coda.
- Le spiegazioni iniziano dal risultato e usano frasi sotto 120 caratteri quando possibile.
- Empty state: una sola azione primaria e una frase che spiega cosa apparirà dopo.
- Loading: mantenere struttura con skeleton discreti; non mostrare valori a zero come dati reali.

## Edge Cases

- **Nessun dato**: hero invita a inserire il saldo; nessuna stima incompleta.
- **Importi molto grandi**: scala fluida `clamp()`, minimo 32px; nessuna ellissi.
- **Nomi lunghi**: due righe nelle liste, nessuna sovrapposizione con importo.
- **Più di 6 scadenze**: Home mostra le prime 6; l’elenco completo resta nei Movimenti.
- **Connessione lenta/offline**: shell PWA disponibile; nessun font remoto necessario per la leggibilità.
- **Dati incoerenti**: card warning con spiegazione e azione concreta, senza giudizi.

## Animation / Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---:|---|
| Page sections | cambio vista | fade + translateY 10px, stagger 55ms | 480ms | `motion-enter` |
| Hero decoration | caricamento | scala lenta da .96 a 1 | 700ms | `motion-enter` |
| Route line | caricamento | scaleY da 0 a 1 | 600ms | `motion-enter` |
| Chart bar | ingresso viewport | scaleX da 0 a 1 | 650ms | `motion-enter` |
| Nav active pill | cambio vista | colore + scala .96→1 | 220ms | `motion-standard` |
| Modal | apertura | translateY 22px + fade | 320ms | `motion-enter` |

Con `prefers-reduced-motion: reduce`, tutte le animazioni e transizioni sono disattivate.

## Accessibility Notes

- Contrasto minimo WCAG AA per testo e controlli.
- Target touch minimo `44×44px`; CTA primaria minimo `48px` in altezza.
- Focus visibile con `:focus-visible`; non affidarsi solo al colore.
- Ordine focus: header → contenuto → CTA → navigazione.
- `summary` mantiene semantica nativa e funziona da tastiera.
- Toast con `role=status` e `aria-live=polite`; errori associati al relativo campo.
- Icone decorative `aria-hidden=true`; pulsanti icona con `aria-label` esplicita.
