/**
 * PustakaSMP - Google Apps Script Web App
 * Menerima data buku dari frontend dan menyimpannya ke Sheet "Koleksi"
 * 
 * Kolom sheet (A-I):
 * A: ISBN | B: Judul | C: Penulis | D: Penerbit | E: Tahun
 * F: Mapel | G: Kelas | H: Nomor Induk | I: Tanggal Input
 */

const SHEET_NAME = 'Koleksi';
const SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_ANDA';

// ============ HELPER ============

function getSheet() {
  // Jika SPREADSHEET_ID sudah diganti, gunakan ID tersebut
  if (SPREADSHEET_ID && !SPREADSHEET_ID.includes('GANTI')) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(SHEET_NAME);
  }
  // Fallback: gunakan spreadsheet aktif (saat testing di script editor)
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function initSheet() {
  let sheet = getSheet();
  if (!sheet) {
    const ss = SPREADSHEET_ID && !SPREADSHEET_ID.includes('GANTI')
      ? SpreadsheetApp.openById(SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.insertSheet(SHEET_NAME);
    // Header
    sheet.appendRow(['ISBN', 'Judul', 'Penulis', 'Penerbit', 'Tahun', 'Mapel', 'Kelas', 'Nomor Induk', 'Tanggal Input']);
    // Format header bold
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    // Freeze header row
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateJsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function checkDuplicate(sheet, isbn, nomorInduk) {
  const data = sheet.getDataRange().getValues();
  // Mulai dari baris ke-2 (indeks 1) karena baris 1 adalah header
  for (let i = 1; i < data.length; i++) {
    const rowISBN = String(data[i][0] || '').trim();
    const rowNomorInduk = String(data[i][7] || '').trim();
    const isbnMatch = rowISBN === isbn.trim();
    const indukMatch = rowNomorInduk === nomorInduk.trim();
    if (isbnMatch && indukMatch) {
      return true;
    }
  }
  return false;
}

// ============ WEB APP ENDPOINTS ============

/**
 * doGet - Untuk cek status / testing Web App
 * Contoh: GET https://script.google.com/.../exec?action=status
 */
function doGet(e) {
  const action = e.parameter.action || 'status';
  
  if (action === 'status') {
    try {
      const sheet = getSheet();
      const rowCount = sheet ? sheet.getLastRow() - 1 : 0;
      return generateJsonResponse({
        status: 'ok',
        message: 'PustakaSMP Web App aktif',
        sheetName: SHEET_NAME,
        totalRecords: Math.max(0, rowCount)
      });
    } catch (err) {
      return generateJsonResponse({
        status: 'error',
        message: 'Gagal mengakses sheet: ' + err.message
      }, 500);
    }
  }
  
  if (action === 'list') {
    try {
      const sheet = getSheet();
      if (!sheet) {
        return generateJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan' }, 404);
      }
      const data = sheet.getDataRange().getValues();
      const rows = [];
      for (let i = 1; i < data.length; i++) {
        rows.push({
          isbn: data[i][0],
          judul: data[i][1],
          penulis: data[i][2],
          penerbit: data[i][3],
          tahun: data[i][4],
          mapel: data[i][5],
          kelas: data[i][6],
          nomorInduk: data[i][7],
          tanggalInput: data[i][8]
        });
      }
      return generateJsonResponse({ status: 'ok', data: rows });
    } catch (err) {
      return generateJsonResponse({ status: 'error', message: err.message }, 500);
    }
  }
  
  return generateJsonResponse({ status: 'error', message: 'Aksi tidak dikenal' }, 400);
}

/**
 * doPost - Menerima data buku baru
 * Body JSON: { isbn, judul, penulis, penerbit, tahun, mapel, kelas, nomorInduk }
 */
function doPost(e) {
  try {
    // Handle preflight OPTIONS
    if (e.parameter && e.parameter.method === 'OPTIONS') {
      return generateJsonResponse({ status: 'ok' });
    }
    
    const body = JSON.parse(e.postData.contents);
    const { isbn, judul, penulis, penerbit, tahun, mapel, kelas, nomorInduk } = body;
    
    // Validasi wajib
    if (!isbn || !judul || !nomorInduk) {
      return generateJsonResponse({
        status: 'error',
        message: 'Field wajib: isbn, judul, nomorInduk'
      }, 400);
    }
    
    const sheet = initSheet();
    
    // Cek duplikat berdasarkan ISBN + Nomor Induk
    const isDuplicate = checkDuplicate(sheet, isbn, nomorInduk);
    if (isDuplicate) {
      return generateJsonResponse({
        status: 'duplicate',
        message: 'Buku dengan ISBN ' + isbn + ' dan Nomor Induk ' + nomorInduk + ' sudah ada.'
      }, 409);
    }
    
    // Tambahkan baris baru
    const tanggalInput = new Date().toISOString();
    sheet.appendRow([isbn, judul, penulis || '', penerbit || '', tahun || '', mapel || '', kelas || '', nomorInduk, tanggalInput]);
    
    return generateJsonResponse({
      status: 'ok',
      message: 'Data berhasil disimpan',
      data: { isbn, judul, nomorInduk, tanggalInput }
    });
    
  } catch (err) {
    return generateJsonResponse({
      status: 'error',
      message: 'Terjadi kesalahan: ' + err.message
    }, 500);
    
  }
}

/**
 * doOptions - Menangani preflight CORS OPTIONS
 */
function doOptions(e) {
  return generateJsonResponse({ status: 'ok' });
}
