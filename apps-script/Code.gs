// ═══════════════════════════════════════════════════════════════
//  HETU PORTAL — Google Apps Script  (FINAL MERGED + NOTES + CYCLE SYNC v2)
//  Sheets used:
//    Feelings   — feelings entries
//    Diary      — diary entries
//    PeriodData — legacy cycle log (kept; used once to seed CycleSync)
//    CycleSync  — NEW: shared cycle tracker + daily check-ins (key/json/updated)
//    LoveNotes  — love notes
//    GameScores — all game high scores (incl. LoveTyper)
// ═══════════════════════════════════════════════════════════════

// ── Helpers ────────────────────────────────────────────────────
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}


// Shared secret gate for every public web-app request. Configure HETU_SECRET in Script Properties.
function hetuSecretMatches_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('HETU_SECRET') || '';
  if (typeof provided !== 'string' || !expected) return false;
  let difference = provided.length ^ expected.length;
  const length = Math.max(provided.length, expected.length);
  for (let i = 0; i < length; i++) difference |= (provided.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  return difference === 0;
}

function hetuUnauthorized_() {
  return jsonOut({ status: 'error', code: 'unauthorized', message: 'Unauthorized.' });
}

// ══════════════════════════════════════════════════════════════
//  doGet — handles all GET requests
// ══════════════════════════════════════════════════════════════
function doGet(e) {
  const params = (e && e.parameter) || {};
  if (!hetuSecretMatches_(params.secret)) return hetuUnauthorized_();
  const action = params.action;

  // ── GET: Shared cycle document (NEW) ───────────────────────
  if (action === 'getCycleDoc') {
    try {
      return jsonOut({ status: 'success', items: cycleRead_(), t: Date.now() });
    } catch (err) {
      return jsonOut({ status: 'error', message: err.message });
    }
  }

  // ── GET: Feelings entries ──────────────────────────────────
  if (action === 'getFeelingsEntries') {
    return getSheetEntries('Feelings');
  }

  // ── GET: Diary entries ─────────────────────────────────────
  if (action === 'getDiaryEntries') {
    return getSheetEntries('Diary');
  }

  // ── GET: Period entries for a user (legacy) ────────────────
  if (action === 'getPeriodEntries') {
    const user = e.parameter.user;
    if (!user) return jsonOut({ status: 'error', message: 'User parameter missing.' });
    try {
      const sheet = getOrCreateSheet('PeriodData',
        ['Timestamp','StartDate','EndDate','Mood','LoggedBy']);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return jsonOut({ status: 'success', data: [] });
      const headers = data.shift();
      const startIdx  = headers.indexOf('StartDate');
      const endIdx    = headers.indexOf('EndDate');
      const moodIdx   = headers.indexOf('Mood');
      const userIdx   = headers.indexOf('LoggedBy');
      const entries = data
        .filter(row => row[userIdx] === user)
        .map(row => ({
          startDate: fmtDate(row[startIdx]),
          endDate:   fmtDate(row[endIdx]),
          mood:      row[moodIdx] || '',
          loggedBy:  row[userIdx]
        }));
      return jsonOut({ status: 'success', data: entries });
    } catch (err) {
      return jsonOut({ status: 'error', message: err.message });
    }
  }

  // ── GET: Love Notes ────────────────────────────────────────
  if (action === 'getNotes') {
    try {
      const sheet = getOrCreateSheet('LoveNotes', ['Timestamp','Text','Author']);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return jsonOut({ status: 'success', data: [] });
      data.shift(); // remove header row
      const notes = data.map(row => ({
        ts:     new Date(row[0]).toISOString(),
        text:   row[1],
        author: row[2]
      })).reverse(); // newest first
      return jsonOut({ status: 'success', data: notes });
    } catch (err) {
      return jsonOut({ status: 'error', message: err.message });
    }
  }

  // ── GET: Game Leaderboard ──────────────────────────────────
  if (action === 'getLeaderboard') {
    const game = e.parameter.game || '';
    try {
      const sheet = getOrCreateSheet('GameScores',
        ['Timestamp','Game','Score','Player','Accuracy']);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return jsonOut({ status: 'success', data: [] });
      data.shift();
      const filtered = data
        .filter(row => !game || String(row[1]).includes(game))
        .map(row => ({
          timestamp: new Date(row[0]).toISOString(),
          game:      row[1],
          score:     Number(row[2]),
          player:    row[3],
          accuracy:  row[4] || ''
        }))
        .sort((a, b) => b.score - a.score);
      return jsonOut({ status: 'success', data: filtered });
    } catch (err) {
      return jsonOut({ status: 'error', message: err.message });
    }
  }

  return jsonOut({ status: 'error', message: 'Invalid GET action.' });
}


// ══════════════════════════════════════════════════════════════
//  doPost — handles all POST requests
// ══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    let body = {};
    if (e && e.postData && e.postData.contents && /^(text\/plain|application\/json)/i.test(String(e.postData.type))) {
      try { body = JSON.parse(e.postData.contents || '{}'); }
      catch (parseError) { return jsonOut({ status: 'error', message: 'Invalid JSON body.' }); }
    }
    if (!hetuSecretMatches_(body.secret || params.secret)) return hetuUnauthorized_();

    // ── POST: Cycle sync (JSON body) ─────────────────────────
    if (body.items) {
      return jsonOut({ status: 'success', items: cycleWrite_(body.items), t: Date.now() });
    }


    const formType = params.formType;

    // ── POST: Game Score (works for ALL games incl. LoveTyper) ─
    if (formType === 'gameScoreEntry') {
      const sheet = getOrCreateSheet('GameScores',
        ['Timestamp','Game','Score','Player','Accuracy']);
      sheet.appendRow([
        new Date(),
        params.game   || 'Unknown',
        Number(params.score) || 0,
        params.player || 'Unknown',
        params.accuracy || ''
      ]);
      return jsonOut({ status: 'success', message: 'Score saved!' });
    }

    // ── POST: Period Entry (legacy add / delete) ───────────────
    if (formType === 'periodEntry') {
      const sheet = getOrCreateSheet('PeriodData',
        ['Timestamp','StartDate','EndDate','Mood','LoggedBy']);
      const action      = params.action;     // 'add' or 'delete'
      const startDate   = params.date;       // start date string
      const endDate     = params.endDate || startDate;
      const mood        = params.mood || '';
      const submittedBy = params.submittedBy || '';

      if (action === 'add') {
        sheet.appendRow([new Date(), new Date(startDate), new Date(endDate), mood, submittedBy]);
        return jsonOut({ status: 'success', message: 'Period entry saved!' });
      }

      if (action === 'delete') {
        const data = sheet.getDataRange().getValues();
        const headers   = data[0];
        const startIdx  = headers.indexOf('StartDate');
        const userIdx   = headers.indexOf('LoggedBy');
        for (let i = data.length - 1; i >= 1; i--) {
          const rowDate = fmtDate(data[i][startIdx]);
          const rowUser = data[i][userIdx];
          if (rowDate === startDate && rowUser === submittedBy) {
            sheet.deleteRow(i + 1);
            return jsonOut({ status: 'success', message: 'Period entry deleted.' });
          }
        }
        return jsonOut({ status: 'error', message: 'Entry not found.' });
      }
    }

    // ── POST: Love Note ────────────────────────────────────────
    if (formType === 'noteEntry') {
      const sheet = getOrCreateSheet('LoveNotes', ['Timestamp','Text','Author']);
      sheet.appendRow([
        new Date(),
        params.text   || '',
        params.author || 'Unknown'
      ]);
      return jsonOut({ status: 'success', message: 'Note saved!' });
    }

    // ── POST: Feelings Entry ───────────────────────────────────
    if (formType === 'feelingsEntry') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feelings');
      if (!sheet) throw new Error("Sheet 'Feelings' not found.");
      sheet.appendRow([new Date(), params.submittedBy, params.emotion, params.message]);
      return jsonOut({ status: 'success', data: JSON.stringify(params) });
    }

    // ── POST: Diary Entry ──────────────────────────────────────
    if (formType === 'diaryEntry') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Diary');
      if (!sheet) throw new Error("Sheet 'Diary' not found.");
      sheet.appendRow([new Date(params.date), params.thoughts, params.submittedBy, params.date]);
      return jsonOut({ status: 'success', data: JSON.stringify(params) });
    }

    // ── POST: Reply Entry ──────────────────────────────────────
    if (formType === 'replyEntry') {
      const sheetName = params.entryType === 'feeling' ? 'Feelings' : 'Diary';
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) throw new Error(`Sheet '${sheetName}' not found.`);
      const idColumn = params.entryType === 'feeling' ? 0 : 3;
      const data = sheet.getDataRange().getValues();
      const rowIndex = data.findIndex(row => String(row[idColumn]) == String(params.entryIdentifier));
      if (rowIndex > -1) {
        sheet.getRange(rowIndex + 1, sheet.getLastColumn() - 2, 1, 3)
             .setValues([[params.replyMessage, params.repliedBy, new Date()]]);
        return jsonOut({ status: 'success', data: JSON.stringify(params) });
      } else {
        throw new Error('Original entry not found.');
      }
    }

    throw new Error('Invalid formType: ' + formType);

  } catch (error) {
    Logger.log(error.toString());
    return jsonOut({ status: 'error', message: error.toString() });
  }
}


// ══════════════════════════════════════════════════════════════
//  CYCLE SYNC (NEW) — one row per item: Key | Json | Updated(ms)
//  Newest "u" wins. Deletes are stored as {del:true,u} tombstones.
// ══════════════════════════════════════════════════════════════
const CYCLE_SHEET = 'CycleSync';
const CYCLE_HEAD  = ['Key', 'Json', 'Updated'];

function cycleSheet_() { return getOrCreateSheet(CYCLE_SHEET, CYCLE_HEAD); }

function cycleReadRaw_(sheet) {
  const last = sheet.getLastRow();
  const out = {};
  if (last < 2) return out;
  sheet.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    if (!r[0]) return;
    try { out[String(r[0])] = JSON.parse(r[1]); } catch (e) {}
  });
  return out;
}

// One-time seed from the old PeriodData sheet, so nothing already logged is lost.
function cycleSeedFromLegacy_(sheet) {
  const src = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PeriodData');
  if (!src || src.getLastRow() < 2) return;
  const data = src.getDataRange().getValues();
  const h = data.shift();
  const iT = h.indexOf('Timestamp'), iS = h.indexOf('StartDate'), iE = h.indexOf('EndDate'), iU = h.indexOf('LoggedBy');
  const rows = [], seen = {};
  data.forEach(function (r) {
    const start = fmtDate(r[iS]);
    if (!start || seen[start]) return;
    seen[start] = true;
    const end = fmtDate(r[iE]);
    const u = r[iT] ? new Date(r[iT]).getTime() : Date.now();
    const item = { start: start, end: (end && end !== start) ? end : '', by: r[iU] || '', u: u };
    rows.push(['p:' + start, JSON.stringify(item), u]);
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function cycleRead_() {
  const sheet = cycleSheet_();
  if (sheet.getLastRow() < 2) {
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { if (sheet.getLastRow() < 2) cycleSeedFromLegacy_(sheet); } finally { lock.releaseLock(); }
  }
  return cycleReadRaw_(sheet);
}

function cycleWrite_(incoming) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sheet = cycleSheet_();
    if (sheet.getLastRow() < 2) cycleSeedFromLegacy_(sheet);
    const last = sheet.getLastRow();
    const rowOf = {}, current = {};
    if (last >= 2) {
      sheet.getRange(2, 1, last - 1, 2).getValues().forEach(function (r, i) {
        if (!r[0]) return;
        rowOf[String(r[0])] = i + 2;
        try { current[String(r[0])] = JSON.parse(r[1]); } catch (e) { current[String(r[0])] = { u: 0 }; }
      });
    }
    const appends = [];
    Object.keys(incoming || {}).forEach(function (k) {
      const v = incoming[k];
      if (!v || typeof v !== 'object' || !/^[pdc]:|^cfg$/.test(k)) return;   // only known key types
      const cur = current[k];
      if (cur && (cur.u || 0) >= (v.u || 0)) return;                        // ours is newer or equal
      current[k] = v;
      if (rowOf[k]) sheet.getRange(rowOf[k], 1, 1, 3).setValues([[k, JSON.stringify(v), v.u || 0]]);
      else appends.push([k, JSON.stringify(v), v.u || 0]);
    });
    if (appends.length) sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, 3).setValues(appends);
    return current;
  } finally { lock.releaseLock(); }
}


// ══════════════════════════════════════════════════════════════
//  Shared helpers
// ══════════════════════════════════════════════════════════════

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fmtDate(val) {
  if (!val) return '';
  try { return Utilities.formatDate(new Date(val), 'UTC', 'yyyy-MM-dd'); }
  catch(e) { return String(val); }
}

function getSheetEntries(sheetName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet '${sheetName}' not found.`);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const entries = data.map(row => {
      let entry = {};
      headers.forEach((h, i) => { entry[h] = row[i]; });
      return entry;
    });
    return jsonOut({ status: 'success', data: entries });
  } catch (err) {
    return jsonOut({ status: 'error', message: err.toString() });
  }
}
