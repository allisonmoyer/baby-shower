const SHEET_NAMES = {
  traditions: "Traditions",
  advice: "Advice",
  allSubmissions: "All Submissions",
  allie: "Allie View",
  mel: "Melissa View",
  both: "Send to Both"
};

function doPost(e) {
  const data = normalizeRequest_(e);
  const formType = data.formType === "tradition" ? "tradition" : "advice";
  const formSheet = formType === "tradition" ? SHEET_NAMES.traditions : SHEET_NAMES.advice;

  appendRow_(SHEET_NAMES.allSubmissions, data);
  appendRow_(formSheet, data);
  appendRecipientRows_(data);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeRequest_(e) {
  const params = e && e.parameter ? e.parameter : {};

  return {
    submittedAt: params.submittedAt || new Date().toISOString(),
    eventTitle: params.eventTitle || "",
    formType: params.formType || "",
    recipient: params.recipient || "both",
    guestName: params.guestName || "",
    title: params.title || "",
    message: params.message || "",
    timing: params.timing || ""
  };
}

function appendRow_(sheetName, data) {
  const sheet = getSheet_(sheetName);

  sheet.appendRow([
    data.submittedAt,
    data.eventTitle,
    data.formType,
    data.recipient,
    data.guestName,
    data.title,
    data.message,
    data.timing
  ]);
}

function appendRecipientRows_(data) {
  if (data.recipient === "both") {
    appendRow_(SHEET_NAMES.both, data);
    appendRow_(SHEET_NAMES.allie, data);
    appendRow_(SHEET_NAMES.mel, data);
    return;
  }

  if (data.recipient === "allie") {
    appendRow_(SHEET_NAMES.allie, data);
    return;
  }

  appendRow_(SHEET_NAMES.mel, data);
}

function getSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (sheet) {
    return sheet;
  }

  const created = spreadsheet.insertSheet(sheetName);
  created.appendRow([
    "Submitted At",
    "Event Title",
    "Form Type",
    "Recipient",
    "Guest Name",
    "Title",
    "Message",
    "Timing"
  ]);
  created.setFrozenRows(1);

  return created;
}
