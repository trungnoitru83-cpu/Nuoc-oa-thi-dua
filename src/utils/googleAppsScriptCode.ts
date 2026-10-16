/**
 * GOOGLE APPS SCRIPT CODE (Code.gs)
 * Copy toàn bộ đoạn mã bên dưới và dán vào Trình biên tập Google Apps Script (Extensions -> Apps Script)
 * trong Bảng tính Google Sheet của bạn.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `
/**
 * GOOGLE APPS SCRIPT - HỆ THỐNG ĐÁNH GIÁ VÀ CHẤM ĐIỂM THI ĐUA VIÊN CHỨC
 * Sheet 1: DanhSachVienChuc (hoặc HeThong_NguoiDung_NhanSu)
 * Sheet 2: Data_Diem_M02_M03_Thang
 */

// 1. DANH SÁCH MÃ VÀ HỌ TÊN CHUẨN (50 CÁN BỘ / VIÊN CHỨC)
var EMPLOYEES_DATA = [
  ["TĐ01", "Nguyễn Xuân Ảnh"],
  ["TĐ02", "Hồ Thị Hiến"],
  ["TĐ03", "Đinh Hữu Phước"],
  ["TĐ04", "Nguyễn Thị Hồng"],
  ["TĐ05", "Vũ Thị Hồng Ngọc"],
  ["TĐ06", "Lương Văn Hơn"],
  ["TĐ07", "Nguyễn Thị Tường Vy"],
  ["TĐ08", "Nguyễn Phạm Trúc Phương"],
  ["TĐ09", "Huỳnh Thị Minh Hằng"],
  ["TĐ10", "Nguyễn Đình Lâu"],
  ["TĐ11", "Hồ Thị Hiếu"],
  ["TĐ12", "Lê Văn Lập"],
  ["TĐ13", "Hoàng Văn Hùng"],
  ["TĐ14", "Nguyễn Thị Hồng Châu"],
  ["TĐ15", "Trần Thị Nhật"],
  ["TĐ16", "Lê Thị Phương Uyên"],
  ["TĐ17", "Nguyễn Duy Vũ"],
  ["TĐ18", "Hồ Thị Bờ"],
  ["TĐ19", "Nguyễn Thị Hoà"],
  ["TĐ20", "Huỳnh Thị Trang"],
  ["TĐ21", "Huỳnh Thị Bích Lợi"],
  ["TĐ22", "Phạm Lý Nghĩa"],
  ["TĐ23", "Nguyễn Văn Trung"],
  ["TĐ24", "Nguyễn Văn Ân Tình"],
  ["TĐ25", "Trần Thị Kim Tuyến"],
  ["TĐ26", "Lê Thị Hoa"],
  ["TĐ27", "Bùi Thị Hồng Thắm"],
  ["TĐ28", "Bùi Thị Mỹ An"],
  ["TĐ29", "Trần Thị Kiều Hương"],
  ["TĐ30", "Nguyễn Văn Sĩ"],
  ["TĐ31", "Nguyễn Hùng Vỹ"],
  ["TĐ32", "Cao Thị Hà My"],
  ["TĐ33", "Huỳnh Thị Mi Sa"],
  ["TĐ34", "Lữ Văn Lam"],
  ["TĐ35", "Trần Văn Hảo"],
  ["TĐ36", "Huỳnh Văn Bình"],
  ["TĐ37", "Nguyễn Quốc Hội"],
  ["TĐ38", "Đặng Thị Thùy Nga"],
  ["TĐ39", "Nguyễn Thị Thủy"],
  ["TĐ40", "Trương Thị Hoài Thu"],
  ["TĐ41", "Trần Thị Phương Loan"],
  ["TĐ42", "(Nhập họ tên viên chức mới 42)"],
  ["TĐ43", "(Nhập họ tên viên chức mới 43)"],
  ["TĐ44", "(Nhập họ tên viên chức mới 44)"],
  ["TĐ45", "(Nhập họ tên viên chức mới 45)"],
  ["TĐ46", "(Nhập họ tên viên chức mới 46)"],
  ["TĐ47", "(Nhập họ tên viên chức mới 47)"],
  ["TĐ48", "(Nhập họ tên viên chức mới 48)"],
  ["TĐ49", "(Nhập họ tên viên chức mới 49)"],
  ["TĐ50", "(Nhập họ tên viên chức mới 50)"]
];

/**
 * Hàm đồng bộ danh mục 50 viên chức vào trang tính 'DanhSachVienChuc' hoặc 'HeThong_NguoiDung_NhanSu'
 * Chạy trực tiếp từ menu Google Sheet hoặc gọi tự động khi cập nhật.
 */
function syncStaffList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "DanhSachVienChuc";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.getSheetByName("HeThong_NguoiDung_NhanSu");
  }
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Tiêu đề cột A & B
  sheet.getRange(1, 1, 1, 2).setValues([["Mã viên chức", "Họ và tên"]]);
  sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");

  // Ghi đè danh mục 50 cán bộ vào Cột A và B
  sheet.getRange(2, 1, EMPLOYEES_DATA.length, 2).setValues(EMPLOYEES_DATA);
  sheet.autoResizeColumns(1, 2);
  
  Logger.log("✅ Đã đồng bộ thành công " + EMPLOYEES_DATA.length + " viên chức vào trang tính " + sheet.getName());
  return "✅ Đã đồng bộ " + EMPLOYEES_DATA.length + " viên chức vào Sheet " + sheet.getName();
}

/**
 * Xử lý Yêu cầu HTTP POST từ Web App gửi lên
 */
function doPost(e) {
  try {
    var rawContents = e.postData.contents;
    var data = JSON.parse(rawContents);

    if (data.action === "syncStaff") {
      var syncResult = syncStaffList();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: syncResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "saveDiem" || data.maChamDiem) {
      var saveResult = saveDiemRecord(data);
      return ContentService.createTextOutput(JSON.stringify(saveResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Action không hợp lệ"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Lỗi Server Google Apps Script: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Hàm lưu hoặc cập nhật bản ghi chấm điểm vào tab 'Data_Diem_M02_M03_Thang'
 */
function saveDiemRecord(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Data_Diem_M02_M03_Thang";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [
      ["Mã chấm điểm", "Kỳ đánh giá", "Mã thi đua", "Họ tên", "Chức vụ", "Tổ chuyên môn", "Mẫu áp dụng", "Điểm A", "Điểm B", "Điểm Cộng/Trừ", "Tổng điểm", "Xếp loại", "Ý kiến nhận xét", "Trạng thái", "Ngày gửi"]
    ];
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
      .setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
  }

  var maChamDiem = data.maChamDiem || ("CD-" + (data.kyDanhGia ? data.kyDanhGia.replace('/', '') : "202610") + "-" + (data.teacherId || data.maThiDua));
  var kyDanhGia = data.kyDanhGia || "10/2026";
  var maThiDua = data.teacherId || data.maThiDua || "TĐ01";
  var hoTen = data.hoTen || "";
  var chucVu = data.chucVu || "Giáo viên";
  var toChuyenMon = data.toChuyenMon || "Tổ chuyên môn";
  var mauApDung = data.mauApDung || "Mẫu 03";
  var diemA = Number(data.diemA || 0);
  var diemB = Number(data.diemB || 0);
  var diemCongTru = Number(data.diemCongTru || 0);
  var tongDiem = Number(data.tongDiem || 0);
  var xepLoai = data.xepLoai || "Hoàn thành tốt";
  var yKien = data.yKien || "Không";
  var trangThai = data.trangThai || "Đã nộp";
  var ngayGui = data.ngayGui || new Date().toISOString();

  var rowValues = [
    maChamDiem,
    kyDanhGia,
    maThiDua,
    hoTen,
    chucVu,
    toChuyenMon,
    mauApDung,
    diemA,
    diemB,
    diemCongTru,
    tongDiem,
    xepLoai,
    yKien,
    trangThai,
    ngayGui
  ];

  // Kiểm tra xem mã chấm điểm đã tồn tại chưa để cập nhật đúng dòng (tránh lệch dòng/trùng lặp)
  var lastRow = sheet.getLastRow();
  var foundRow = -1;

  if (lastRow > 1) {
    var existingCodes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingCodes.length; i++) {
      if (existingCodes[i][0] === maChamDiem) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow > 0) {
    // Cập nhật dòng đã có
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    return {
      success: true,
      message: "✅ Đã cập nhật thành công bản ghi " + maChamDiem + " vào dòng " + foundRow,
      maChamDiem: maChamDiem,
      rowUpdated: foundRow
    };
  } else {
    // Thêm mới dòng ở cuối
    sheet.appendRow(rowValues);
    return {
      success: true,
      message: "✅ Đã thêm mới thành công bản ghi " + maChamDiem,
      maChamDiem: maChamDiem,
      rowUpdated: sheet.getLastRow()
    };
  }
}

/**
 * Xử lý Yêu cầu GET để kiểm tra trạng thái API hoặc lấy danh mục
 */
function doGet(e) {
  var action = e ? e.parameter.action : "";
  if (action === "getStaff") {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      total: EMPLOYEES_DATA.length,
      employees: EMPLOYEES_DATA
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script API Chấm điểm Thi đua Nước Oa sẵn sàng!",
    totalEmployees: EMPLOYEES_DATA.length
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tạo Menu tùy chỉnh trên Thanh công cụ Google Sheet khi mở tệp
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("⚙️ Quản Lý Thi Đua Nước Oa")
    .addItem("🔄 Đồng bộ danh mục 50 Viên Chức (DanhSachVienChuc)", "syncStaffList")
    .addToUi();
}
`;
