/**
 * Scadenze Fiscali AI - collegamento Google
 * Crea gli eventi su Google Calendar, invia l'email di promemoria ogni mattina
 * e conserva i dati su Google Drive (cartella "Scadenze Fiscali AI").
 *
 * 1) Cambia la parola segreta qui sotto.
 * 2) Esegui una volta la funzione "installa" e autorizza.
 * 3) Distribuisci > Nuova distribuzione > App web (Esegui come: Me, Accesso: Chiunque).
 */
var SEGRETO = 'CAMBIA-QUESTA-PAROLA';
var CARTELLA = 'Scadenze Fiscali AI';
var FILE_DATI = 'scadenze-fiscali-dati.json';
var ORA_AVVISO = 9;   // ora del giorno a cui Calendar mostra l'avviso
var ORA_EMAIL = 7;    // ora dell'email di promemoria

function installa() {
  cartella_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'emailPromemoria') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('emailPromemoria').timeBased().everyDays(1).atHour(ORA_EMAIL).create();
  CalendarApp.getDefaultCalendar().getName();
  Logger.log('Installazione completata. Email di promemoria a: ' + Session.getEffectiveUser().getEmail());
}

function doGet() {
  return out_({ ok: true, info: 'Scadenze Fiscali AI: collegamento attivo' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse(e.postData.contents);
    if (SEGRETO === 'CAMBIA-QUESTA-PAROLA') return out_({ ok: false, error: 'Cambia la parola segreta nello script' });
    if (req.token !== SEGRETO) return out_({ ok: false, error: 'Parola segreta errata' });
    lock.waitLock(20000);
    switch (req.action) {
      case 'ping': return out_({ ok: true, email: Session.getEffectiveUser().getEmail() });
      case 'load': return out_({ ok: true, data: leggi_() });
      case 'save': scrivi_(req.data); return out_({ ok: true });
      case 'createEvents': return out_({ ok: true, results: (req.events || []).map(creaEvento_) });
      case 'deleteEvent': eliminaEvento_(req.eventId); return out_({ ok: true });
      case 'upload': return out_({ ok: true, url: carica_(req) });
      default: return out_({ ok: false, error: 'Azione sconosciuta' });
    }
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function cartella_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('cartella');
  if (id) { try { return DriveApp.getFolderById(id); } catch (x) {} }
  var f = DriveApp.createFolder(CARTELLA);
  p.setProperty('cartella', f.getId());
  return f;
}

function fileDati_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('dati');
  if (id) { try { return DriveApp.getFileById(id); } catch (x) {} }
  var f = cartella_().createFile(FILE_DATI, '{}', 'application/json');
  p.setProperty('dati', f.getId());
  return f;
}

function leggi_() {
  try { return JSON.parse(fileDati_().getBlob().getDataAsString() || '{}'); } catch (x) { return {}; }
}

function scrivi_(data) {
  if (!data || typeof data !== 'object') throw new Error('Dati non validi');
  fileDati_().setContent(JSON.stringify(data));
}

function giorno_(s) {
  var a = String(s).split('-');
  return new Date(Number(a[0]), Number(a[1]) - 1, Number(a[2]));
}

function creaEvento_(ev) {
  try {
    var e = CalendarApp.getDefaultCalendar().createAllDayEvent(ev.title, giorno_(ev.date), { description: ev.description || '' });
    e.removeAllReminders();
    var visti = {};
    (ev.reminders || []).slice(0, 5).forEach(function (g) {
      var min = Math.min(40320, Math.max(0, Number(g) * 1440 - ORA_AVVISO * 60));
      if (!visti[min]) { visti[min] = 1; e.addPopupReminder(min); }
    });
    e.setColor(CalendarApp.EventColor.RED);
    return { id: ev.id, eventId: e.getId() };
  } catch (err) {
    return { id: ev.id, error: String(err.message || err) };
  }
}

function eliminaEvento_(id) {
  if (!id) return;
  try { var e = CalendarApp.getDefaultCalendar().getEventById(id); if (e) e.deleteEvent(); } catch (x) {}
}

function carica_(req) {
  var blob = Utilities.newBlob(Utilities.base64Decode(req.b64), req.mime || 'application/octet-stream', req.name || 'documento');
  return cartella_().createFile(blob).getUrl();
}

/** Email quotidiana: scadenze di oggi, quelle con un promemoria che cade oggi e, il lunedì, le scadute. */
function emailPromemoria() {
  var d = leggi_(), oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  var clienti = {};
  (d.clients || []).forEach(function (c) { clienti[c.id] = c.nome; });
  var righe = [];
  (d.deadlines || []).forEach(function (x) {
    if (x.stato === 'pagata' || !x.data) return;
    var gg = Math.round((giorno_(x.data) - oggi) / 864e5);
    var avvisa = gg === 0 || (x.promemoria || []).indexOf(gg) >= 0 || (gg < 0 && (gg === -1 || oggi.getDay() === 1));
    if (avvisa) righe.push({ gg: gg, x: x });
  });
  if (!righe.length) return;
  righe.sort(function (a, b) { return a.gg - b.gg; });
  var euro = function (n) { return n === '' || n == null ? '' : ' - ' + Number(n).toFixed(2).replace('.', ',') + ' EUR'; };
  var testo = righe.map(function (r) {
    var quando = r.gg < 0 ? 'SCADUTA da ' + (-r.gg) + ' g' : r.gg === 0 ? 'OGGI' : r.gg === 1 ? 'domani' : 'tra ' + r.gg + ' giorni';
    var area = r.x.owner && r.x.owner !== 'me' ? ' [' + (clienti[r.x.owner] || 'cliente') + ']' : '';
    return '- ' + quando + ' (' + r.x.data.split('-').reverse().join('/') + '): ' + r.x.titolo + area + euro(r.x.importo);
  }).join('\n');
  var urgenti = righe.filter(function (r) { return r.gg <= 1; }).length;
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
    'Scadenze fiscali: ' + righe.length + ' da ricordare' + (urgenti ? ' (' + urgenti + ' urgenti)' : ''),
    'Promemoria dal tuo scadenzario:\n\n' + testo + '\n\nApri l\'app per segnarle come fatte.\n\nScadenze Fiscali AI');
}
