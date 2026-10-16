import { Teacher, Form03Evaluation } from '../types';
import { getCriteriaForTeacher, getClassification, getClassificationLabel, isLeaderTeacher } from '../data/form03Criteria';

// Word document export utility strictly compliant with Nghị định 30/2020/NĐ-CP
export const exportToWord = (htmlContent: string, fileName: string) => {
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
        xmlns:w='urn:schemas-microsoft-com:office:word' 
        xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${fileName}</title>
          <style>
            @page Section1 {
              size: 595.3pt 841.9pt; /* Standard A4 */
              margin: 20mm 15mm 20mm 30mm; /* Top 20mm, Right 15mm, Bottom 20mm, Left 30mm per Nghị định 30 */
              mso-header-margin: 36.0pt;
              mso-footer-margin: 36.0pt;
              mso-paper-source: 0;
            }
            div.Section1 { page: Section1; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 13pt; 
              line-height: 1.35; 
              color: #000000; 
              background-color: #ffffff;
            }
            p {
              margin-top: 0;
              margin-bottom: 4pt;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            
            /* Table formatting according to Nghị định 30 */
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 8pt; 
              margin-bottom: 10pt; 
              font-family: 'Times New Roman', Times, serif;
            }
            th, td { 
              border: 1pt solid #000000; 
              padding: 4pt 6pt; 
              text-align: left; 
              vertical-align: top; 
              font-size: 11pt; 
              line-height: 1.25;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
              text-align: center; 
            }
            
            /* Clean layout tables without borders */
            .header-table, .signature-table, .info-table { 
              width: 100%; 
              margin-bottom: 12pt; 
              border: none !important; 
            }
            .header-table td, .signature-table td, .info-table td { 
              border: none !important; 
              padding: 2pt 4pt; 
              vertical-align: top; 
            }
            .title { 
              font-size: 14pt; 
              font-weight: bold; 
              text-align: center; 
              text-transform: uppercase; 
              margin-top: 12pt; 
              margin-bottom: 4pt; 
            }
            .subtitle { 
              font-size: 12pt; 
              font-style: italic; 
              text-align: center; 
              margin-bottom: 12pt; 
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            ${htmlContent}
          </div>
        </body>
        </html>`;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// HTML Generator for Mẫu 02 & Mẫu 03 strictly matching Nghị định 30/2020/NĐ-CP
export const generateForm03NghiDinh30Html = (
  teacher: Teacher,
  evaluation: Form03Evaluation,
  selectedMonth: number,
  selectedYear: number = 2026,
  overrideFormType?: 'mau02' | 'mau03'
): string => {
  const isLeader = overrideFormType === 'mau02' || (overrideFormType === undefined && isLeaderTeacher(teacher));
  const formType = isLeader ? 'mau02' : 'mau03';
  const criteria = getCriteriaForTeacher(teacher, formType);

  let rawPartA_Teacher = 0;
  let rawPartA_Principal = 0;
  let rawPartB_Teacher = 0;
  let rawPartB_Principal = 0;
  let bonus_Teacher = 0;
  let bonus_Principal = 0;
  let deduction_Teacher = 0;
  let deduction_Principal = 0;

  criteria.forEach(c => {
    const isBonusOrDed = c.section === 'BONUS' || c.section === 'DEDUCTION';
    const defaultScore = isBonusOrDed ? 0 : c.maxPoints;
    const sc = evaluation.scores?.[c.id] || { teacherScore: defaultScore, principalScore: defaultScore };

    if (c.section === 'A') {
      rawPartA_Teacher += Number(sc.teacherScore) || 0;
      rawPartA_Principal += Number(sc.principalScore) || 0;
    } else if (c.section === 'B') {
      rawPartB_Teacher += Number(sc.teacherScore) || 0;
      rawPartB_Principal += Number(sc.principalScore) || 0;
    } else if (c.section === 'BONUS') {
      bonus_Teacher += Number(sc.teacherScore) || 0;
      bonus_Principal += Number(sc.principalScore) || 0;
    } else if (c.section === 'DEDUCTION') {
      deduction_Teacher += Number(sc.teacherScore) || 0;
      deduction_Principal += Number(sc.principalScore) || 0;
    }
  });

  const partA_Teacher = Math.min(30, Math.round(rawPartA_Teacher * 100) / 100);
  const partA_Principal = Math.min(30, Math.round(rawPartA_Principal * 100) / 100);
  const partB_Teacher = Math.min(70, Math.round(rawPartB_Teacher * 100) / 100);
  const partB_Principal = Math.min(70, Math.round(rawPartB_Principal * 100) / 100);

  const grandTotal_Teacher = Math.min(100, Math.max(0, Math.round((partA_Teacher + partB_Teacher + bonus_Teacher - deduction_Teacher) * 100) / 100));
  const grandTotal_Principal = Math.min(100, Math.max(0, Math.round((partA_Principal + partB_Principal + bonus_Principal - deduction_Principal) * 100) / 100));

  const tClass = getClassification(grandTotal_Teacher);
  const pClass = getClassification(grandTotal_Principal);

  const formattedMonth = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;

  const criteriaA = criteria.filter(c => c.section === 'A');
  const criteriaB = criteria.filter(c => c.section === 'B');

  return `
    <!-- Standard Nghị định 30 Header -->
    <table class="header-table" style="width: 100%; border: none;">
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
          <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase;">SỞ GIÁO DỤC VÀ ĐÀO TẠO QUẢNG NAM</div>
          <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase;">TRƯỜNG PTDTBT THCS NƯỚC OA</div>
          <div style="border-bottom: 1px solid #000000; width: 40%; margin: 3pt auto 4pt auto;"></div>
          <div style="font-size: 11pt;">Số: ...../TB-TĐNO</div>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
          <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style="font-weight: bold; font-size: 13pt;"><u>Độc lập - Tự do - Hạnh phúc</u></div>
          <div style="font-style: italic; font-size: 12pt; margin-top: 4pt;">Trà My, ngày 30 tháng ${formattedMonth} năm ${selectedYear}</div>
        </td>
      </tr>
    </table>

    <!-- Title Block -->
    <div style="text-align: center; margin-top: 12pt; margin-bottom: 12pt;">
      <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">
        ${isLeader ? 'BẢNG TỰ ĐÁNH GIÁ VÀ XẾP LOẠI THI ĐUA CÁN BỘ QUẢN LÝ' : 'BẢNG TỰ ĐÁNH GIÁ VÀ XẾP LOẠI THI ĐUA VIÊN CHỨC, GIÁO VIÊN'}
      </div>
      <div style="font-size: 12pt; font-style: italic; margin-top: 3pt;">
        (${isLeader ? 'Dành cho Cán bộ quản lý / Tổ trưởng - Mẫu số 02' : 'Dành cho Giáo viên, Nhân viên - Mẫu số 03'})
      </div>
      <div style="font-size: 13pt; font-weight: bold; margin-top: 4pt;">
        Tháng ${selectedMonth} năm ${selectedYear}
      </div>
    </div>

    <!-- Personal Profile Info -->
    <table class="info-table" style="width: 100%; border: none; margin-bottom: 12pt;">
      <tr>
        <td style="width: 50%; border: none;"><strong>1. Họ và tên:</strong> ${teacher.fullName}</td>
        <td style="width: 50%; border: none;"><strong>2. Ngày, tháng, năm sinh:</strong> ${teacher.dob}</td>
      </tr>
      <tr>
        <td style="width: 50%; border: none;"><strong>3. Chức vụ / Nhiệm vụ:</strong> ${teacher.position ? `${teacher.position} (${teacher.subject})` : teacher.subject}</td>
        <td style="width: 50%; border: none;"><strong>4. Tổ chuyên môn:</strong> ${teacher.department}</td>
      </tr>
      <tr>
        <td colspan="2" style="border: none;"><strong>5. Đơn vị công tác:</strong> ${teacher.school}</td>
      </tr>
    </table>

    <!-- Criteria Table -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt;">
      <thead>
        <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
          <th style="border: 1pt solid #000; padding: 5pt; width: 6%;">STT</th>
          <th style="border: 1pt solid #000; padding: 5pt; width: 54%;">Nội dung thi đua đánh giá</th>
          <th style="border: 1pt solid #000; padding: 5pt; width: 10%;">Tối đa</th>
          <th style="border: 1pt solid #000; padding: 5pt; width: 15%;">Cá nhân tự chấm</th>
          <th style="border: 1pt solid #000; padding: 5pt; width: 15%;">HT Phê duyệt</th>
        </tr>
      </thead>
      <tbody>
        <!-- PHẦN A -->
        <tr style="font-weight: bold; background-color: #f9f9f9;">
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">A</td>
          <td style="border: 1pt solid #000; padding: 4pt;" colSpan="2">PHẦN A: NHIỆM VỤ CHUNG VÀ CHUYÊN MÔN (TỐI ĐA 30 ĐIỂM)</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${partA_Teacher}đ / 30đ</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${partA_Principal}đ / 30đ</td>
        </tr>
        ${criteriaA.map((c, idx) => {
          const sc = evaluation.scores?.[c.id] || { teacherScore: c.maxPoints, principalScore: c.maxPoints };
          return `
            <tr>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${idx + 1}</td>
              <td style="border: 1pt solid #000; padding: 4pt;">${c.title}</td>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${c.maxPoints}</td>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">${sc.teacherScore}</td>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">${sc.principalScore}</td>
            </tr>
          `;
        }).join('')}

        <!-- PHẦN B -->
        <tr style="font-weight: bold; background-color: #f9f9f9;">
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">B</td>
          <td style="border: 1pt solid #000; padding: 4pt;" colSpan="2">PHẦN B: NHIỆM VỤ CỤ THỂ VÀ CÔNG TÁC KIÊM NHIỆM (TỐI ĐA 70 ĐIỂM)</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${partB_Teacher}đ / 70đ</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${partB_Principal}đ / 70đ</td>
        </tr>
        ${criteriaB.map((c, idx) => {
          const sc = evaluation.scores?.[c.id] || { teacherScore: c.maxPoints, principalScore: c.maxPoints };
          let tierRows = '';
          if (c.tiers && c.tiers.length > 0) {
            tierRows = c.tiers.map(t => {
              const isT = sc.teacherScore === t.points ? `✓ (${t.points}đ)` : '';
              const isP = sc.principalScore === t.points ? `✓ (${t.points}đ)` : '';
              return `
                <tr style="font-size: 10pt; font-style: italic;">
                  <td style="border: 1pt solid #000; padding: 2pt 4pt; text-align: center;">${t.code}</td>
                  <td style="border: 1pt solid #000; padding: 2pt 4pt;">- ${t.label}</td>
                  <td style="border: 1pt solid #000; padding: 2pt 4pt; text-align: center;">${t.points}</td>
                  <td style="border: 1pt solid #000; padding: 2pt 4pt; text-align: center; font-weight: bold;">${isT}</td>
                  <td style="border: 1pt solid #000; padding: 2pt 4pt; text-align: center; font-weight: bold;">${isP}</td>
                </tr>
              `;
            }).join('');
          }

          return `
            <tr style="font-weight: bold;">
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${idx + 1}</td>
              <td style="border: 1pt solid #000; padding: 4pt;">${c.title}</td>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${c.maxPoints}</td>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${sc.teacherScore}đ</td>
              <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">${sc.principalScore}đ</td>
            </tr>
            ${tierRows}
          `;
        }).join('')}

        <!-- PHẦN C: ĐIỂM CỘNG -->
        <tr>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">C</td>
          <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold;">Điểm cộng thi đua (Tổng C.1 + C.2 + C.3 + C.4)</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">+7.0</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">+${bonus_Teacher}đ</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">+${bonus_Principal}đ</td>
        </tr>

        <!-- PHẦN D: ĐIỂM TRỪ -->
        <tr>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">D</td>
          <td style="border: 1pt solid #000; padding: 4pt; font-weight: bold;">Điểm trừ thi đua (Tổng D.1 + D.2 + D.3)</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center;">-5.0</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">-${deduction_Teacher}đ</td>
          <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-weight: bold;">-${deduction_Principal}đ</td>
        </tr>

        <!-- TỔNG ĐIỂM -->
        <tr style="font-weight: bold; font-size: 12pt; background-color: #e2e8f0;">
          <td style="border: 1pt solid #000; padding: 6pt; text-align: center;" colSpan="3">
            TỔNG ĐIỂM THI ĐUA CHUẨN = PHẦN A (TỐI ĐA 30Đ) + PHẦN B (TỐI ĐA 70Đ) = TỐI ĐA 100 ĐIỂM
          </td>
          <td style="border: 1pt solid #000; padding: 6pt; text-align: center;">
            ${grandTotal_Teacher} ĐIỂM
          </td>
          <td style="border: 1pt solid #000; padding: 6pt; text-align: center;">
            ${grandTotal_Principal} ĐIỂM
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Classification & Comments -->
    <div style="font-size: 12pt; margin-bottom: 15pt; line-height: 1.5;">
      <div>• <strong>Giáo viên tự xếp loại:</strong> ${getClassificationLabel(tClass)} (${grandTotal_Teacher} điểm)</div>
      <div>• <strong>Hiệu trưởng phê duyệt xếp loại:</strong> <strong style="text-transform: uppercase;">${getClassificationLabel(pClass)} (${grandTotal_Principal} điểm)</strong></div>
      ${evaluation.principalComment ? `<div style="margin-top: 4pt;">• <strong>Ý kiến Ban Giám hiệu:</strong> <em>"${evaluation.principalComment}"</em></div>` : ''}
    </div>

    <!-- Signatures Table -->
    <table class="signature-table" style="width: 100%; border: none; margin-top: 20pt;">
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
          <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ ĐÁNH GIÁ</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
          <div style="height: 60pt; margin-top: 10pt;">
            ${evaluation.teacherSignatureImg ? `<img src="${evaluation.teacherSignatureImg}" style="max-height: 55pt; object-fit: contain;" alt="Chữ ký" />` : ''}
          </div>
          <div style="font-weight: bold; margin-top: 10pt;">${teacher.fullName}</div>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
          <div style="font-weight: bold; text-transform: uppercase;">HIỆU TRƯỜNG PHÊ DUYỆT</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký tên và đóng dấu)</div>
          <div style="height: 60pt; margin-top: 10pt;">
            ${evaluation.principalSignatureImg ? `<img src="${evaluation.principalSignatureImg}" style="max-height: 55pt; object-fit: contain;" alt="Chữ ký Hiệu trưởng" />` : ''}
          </div>
          <div style="font-weight: bold; margin-top: 10pt;">TRƯỜNG PTDTBT THCS NƯỚC OA</div>
        </td>
      </tr>
    </table>
  `;
};

// Export Mẫu 02 or Mẫu 03 directly to Word (.doc) formatted to Nghị định 30
export const exportForm03ToWord = (
  teacher: Teacher,
  evaluation: Form03Evaluation,
  selectedMonth: number,
  selectedYear: number = 2026,
  overrideFormType?: 'mau02' | 'mau03'
) => {
  const isLeader = overrideFormType === 'mau02' || (overrideFormType === undefined && isLeaderTeacher(teacher));
  const formCode = isLeader ? 'Mau_02' : 'Mau_03';
  const cleanName = teacher.fullName.replace(/\s+/g, '_');
  const fileName = `${formCode}_${cleanName}_Thang_${selectedMonth}_${selectedYear}`;

  const html = generateForm03NghiDinh30Html(teacher, evaluation, selectedMonth, selectedYear, overrideFormType);
  exportToWord(html, fileName);
};
