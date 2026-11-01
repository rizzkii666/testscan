// Spreadsheet ID: ambil dari URL spreadsheet
// Contoh URL: https://docs.google.com/spreadsheets/d/1r2p-Afi1JPBk9CO6JVvY3duxDG33S8XDetB-iTTaAW8/edit
// ID-nya adalah bagian setelah /d/ dan sebelum /edit
const SPREADSHEET_ID = '1r2p-Afi1JPBk9CO6JVvY3duxDG33S8XDetB-iTTaAW8';
const SHEET_NAME = 'Sheet1';

function doGet(e) {
  try {
    const p = e.parameter;
    const data = {
      isbn: p.isbn || '',
      judul: p.judul || '',
      penulis: p.penulis || '',
      penerbit: p.penerbit || '',
      tahun: p.tahun || '',
      mapel: p.mapel || '',
      kelas: p.kelas || '',
      nomorInduk: p.nomorInduk || ''
    };

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Cek duplikat berdasarkan ISBN + Nomor Induk
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
      const dup = values.find(r => r[0] === data.isbn && r[7] === data.nomorInduk);
      if (dup) {
        return jsonpResponse(p.callback, {status: 'duplicate', message: 'Data sudah ada'});
      }
    }

    // Append row: [ISBN, Judul, Penulis, Penerbit, Tahun, Mapel, Kelas, NomorInduk, Timestamp]
    sheet.appendRow([
      data.isbn,
      data.judul,
      data.penulis,
      data.penerbit,
      data.tahun,
      data.mapel,
      data.kelas,
      data.nomorInduk,
      new Date()
    ]);

    return jsonpResponse(p.callback, {status: 'ok', message: 'Tersimpan'});

  } catch (err) {
    return jsonpResponse(e.parameter.callback, {status: 'error', message: err.toString()});
  }
}

function jsonpResponse(callbackName, obj) {
  const cb = callbackName || 'callback';
  const output = ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ');');
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return output;
}
