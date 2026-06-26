/**
 * BasketUSA — Note les moves NBA
 * Backend de collecte des votes (Google Apps Script lié à un Google Sheet).
 *
 * Le widget envoie les votes en POST (fire-and-forget) et lit les stats en GET.
 * Deux onglets sont utilisés :
 *   - "Votes"  : une ligne par note (date, session, id du move, joueur, note)
 *   - "Tally"  : agrégat recalculé à la lecture (id, joueur, nb votes, moyenne)
 *
 * INSTALLATION
 *   1. Crée un Google Sheet, ouvre Extensions → Apps Script, colle ce fichier.
 *   2. Déploie : Déployer → Nouveau déploiement → type "Application Web".
 *        - Exécuter en tant que : Moi
 *        - Qui a accès : Tout le monde
 *   3. Copie l'URL .../exec et colle-la dans CONFIG.votesUrl du index.html.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var body = JSON.parse(e.postData.contents);
    var sheet = getSheet_('Votes', ['date', 'session', 'id', 'joueur', 'note']);
    var now = new Date();
    (body.choices || []).forEach(function (c) {
      var note = Math.max(1, Math.min(10, parseInt(c.rating, 10) || 0));
      if (!c.id || !note) return;
      sheet.appendRow([now, body.session || '', c.id, c.name || '', note]);
    });
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var sheet = getSheet_('Votes', ['date', 'session', 'id', 'joueur', 'note']);
  var values = sheet.getDataRange().getValues();
  var tally = {};
  for (var i = 1; i < values.length; i++) {
    var id = values[i][2];
    var joueur = values[i][3];
    var note = parseFloat(values[i][4]) || 0;
    if (!id || !note) continue;
    if (!tally[id]) tally[id] = { id: id, name: joueur, sum: 0, count: 0 };
    tally[id].sum += note;
    tally[id].count += 1;
  }
  var moves = Object.keys(tally).map(function (k) {
    var t = tally[k];
    return { id: t.id, name: t.name, count: t.count, avg: t.count ? t.sum / t.count : 0 };
  });
  writeTally_(moves);
  return ContentService
    .createTextOutput(JSON.stringify({ moves: moves }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
  }
  return sheet;
}

function writeTally_(moves) {
  var sheet = getSheet_('Tally', ['id', 'joueur', 'nb_votes', 'moyenne']);
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), 4).clearContent();
  if (!moves.length) return;
  var rows = moves
    .sort(function (a, b) { return b.avg - a.avg; })
    .map(function (m) { return [m.id, m.name, m.count, Math.round(m.avg * 10) / 10]; });
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}
