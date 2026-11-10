# Scadenze Fiscali AI

Scadenzario fiscale con assistente Gemini, per uso personale e da professionista (più clienti).

**Apri l'app:** https://andreapollastrelli95.github.io/scadenze-fiscali-ai/

## Cosa fa

- **Assistente** – carichi PDF, foto, Word, Excel, email, audio o scrivi testo libero; Gemini propone di archiviare, rispondere o programmare la scadenza con promemoria. Nulla viene salvato senza conferma.
- **Scadenzario** – elenco e vista mese, stati (da fare, scaduta, fatta), esportazione calendario.
- **Elenco scadenze fiscali** – regole ricorrenti per privati, forfettari, P.IVA ordinarie e società, datori di lavoro, rottamazione, con la prossima data calcolata. Viste «Le mie» e «Tutte».
- **Clienti** – ogni cliente ha scadenzario e archivio propri.

## File

| File | A cosa serve |
| --- | --- |
| `index.html` | L'app (un solo file, nessuna installazione) |
| `Code.gs` | Script Google Apps Script: eventi su Calendar, email di promemoria, dati su Drive |
| `LEGGIMI.txt` | Istruzioni d'uso e di collegamento a Google |
| `manifest.webmanifest`, `icon-*.png` | Icona e installazione su Home dell'iPhone e Desktop |

## Chiavi e dati

- La chiave API Gemini si inserisce nelle Impostazioni dell'app e resta nel browser del dispositivo. **Non va mai scritta in questo repository.**
- Anche la parola segreta di `Code.gs` va cambiata solo nella copia su script.google.com, non qui.
- I dati restano sul dispositivo oppure, con il collegamento Google attivo, nella cartella «Scadenze Fiscali AI» del proprio Drive.

## Avvertenza

Elenco verificato a novembre 2026. Proroghe e scadenze comunali o regionali cambiano: l'app è un aiuto organizzativo e non sostituisce il commercialista.
