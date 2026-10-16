import { Teacher, Form01Task } from '../types';

export interface SignatureData {
  evaluatorName?: string;
  evaluatorSignature?: string;
  leaderName?: string;
  leaderSignature?: string;
  principalName?: string;
  principalSignature?: string;
}

/**
 * Generates and downloads a Word file (.doc/.docx) for Form 01 formatted 
 * strictly according to Vietnam Government Decree 30/2020/NĐ-CP on administrative document standards.
 * Includes Section I summary statistics table matching the official 13-column format and 3 signature blocks.
 */
export const exportForm01ToWord = (
  teacher: Teacher,
  tasks: Form01Task[],
  month: number,
  year: number,
  overallSummary: string,
  evaluationDate?: string,
  sigData?: SignatureData
) => {
  const dateObj = evaluationDate ? new Date(evaluationDate) : new Date();
  const dayStr = dateObj.getDate() < 10 ? `0${dateObj.getDate()}` : `${dateObj.getDate()}`;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const formattedDate = `Bắc Trà My, ngày ${dayStr} tháng ${monthStr} năm ${year}`;

  // 13-Column Summary Calculations
  const col1_assigned = tasks.length;
  const col2_completed = tasks.filter(t => (t.completionRate || 0) >= 100 || t.status === 'completed').length;
  const col3_uncompleted = col1_assigned - col2_completed;
  const col4_completionRate = col1_assigned > 0 ? Math.round((col2_completed / col1_assigned) * 100) : 100;

  const col5_early = tasks.filter(t => t.progress === 'Trước tiến độ' || t.progress === 'Sớm hạn').length;
  const col6_onTime = tasks.filter(t => !t.progress || t.progress === 'Đúng tiến độ' || t.progress === 'Đúng hạn').length;
  const col7_late = tasks.filter(t => t.progress?.includes('Chậm') || t.progress?.includes('Trễ')).length;
  const col8_onTimeRate = col1_assigned > 0 ? Math.round(((col5_early + col6_onTime) / col1_assigned) * 100) : 100;

  const col9_satisfactory = tasks.filter(t => !t.quality || t.quality === 'Đạt yêu cầu' || t.quality === 'Đảm bảo').length;
  const col10_exceeded = tasks.filter(t => t.quality?.includes('cao') || t.quality?.includes('Vượt')).length;
  const col11_unsatisfactory = tasks.filter(t => t.quality?.includes('Chưa') || t.quality?.includes('Cần')).length;
  const col12_qualityRate = col1_assigned > 0 ? Math.round(((col9_satisfactory + col10_exceeded) / col1_assigned) * 100) : 100;

  // Determine classification label
  let classificationLabel = 'Hoàn thành xuất sắc nhiệm vụ';
  if (col4_completionRate < 50) {
    classificationLabel = 'Không hoàn thành nhiệm vụ';
  } else if (col4_completionRate < 80) {
    classificationLabel = 'Hoàn thành nhiệm vụ';
  } else if (col4_completionRate < 90) {
    classificationLabel = 'Hoàn thành tốt nhiệm vụ';
  }

  // Categories definition
  const categories = [
    { key: 'I', title: 'I. Nhiệm vụ theo chương trình, kế hoạch công tác năm' },
    { key: 'II', title: 'II. Nhiệm vụ chuyên môn thường xuyên' },
    { key: 'III', title: 'III. Nhiệm vụ đột xuất, phát sinh' },
    { key: 'IV', title: 'IV. Nhiệm vụ khác và kiêm nhiệm' }
  ];

  let taskGlobalCounter = 0;
  let tasksRowsHtml = '';

  categories.forEach(cat => {
    const catTasks = tasks.filter(t => (t.category || 'II') === cat.key);
    
    tasksRowsHtml += `
      <tr style="background-color: #E2EFDA;">
        <td colspan="9" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 11pt; text-transform: uppercase;">
          ${cat.title} (${catTasks.length} công việc)
        </td>
      </tr>
    `;

    if (catTasks.length === 0) {
      tasksRowsHtml += `
        <tr>
          <td style="border: 1px solid #000; text-align: center; padding: 4px; font-size: 10pt; color: #666;" colspan="9">
            <i>Không có nhiệm vụ phát sinh trong kỳ</i>
          </td>
        </tr>
      `;
    } else {
      catTasks.forEach(t => {
        taskGlobalCounter++;
        const workDetail = t.workDone || t.result || 'Đã hoàn thành theo kế hoạch';
        const nature = t.taskNature || 'Thường xuyên';
        const timeStr = t.executionTime ? `<br/><i style="font-size: 10pt; color: #444;">⏱️ ${t.executionTime}</i>` : '';
        const note = t.noteExplanation ? ` / <br/><i>Ghi chú: ${t.noteExplanation}</i>` : '';

        tasksRowsHtml += `
          <tr>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; vertical-align: middle;">${taskGlobalCounter}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top;"><b>${t.taskName || ''}</b></td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 10pt; vertical-align: middle;">${nature}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top;">${t.assignedTarget || ''}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top;">
              ${workDetail}${timeStr}
            </td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; vertical-align: middle;">${t.progress || 'Đúng tiến độ'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; vertical-align: middle;">${t.quality || 'Đạt yêu cầu'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; font-weight: bold; vertical-align: middle;">${t.completionRate || 100}%</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 10pt; vertical-align: top; word-break: break-all;">
              ${t.evidenceLink ? `<a href="${t.evidenceLink}" style="color: #0000FF; text-decoration: underline;">Minh chứng</a>` : 'Đã đạt'}${note}
            </td>
          </tr>
        `;
      });
    }
  });

  const summary13ColTableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: #f2f2f2; text-align: center; font-weight: bold;">
          <th colspan="4" style="border: 1px solid #000; padding: 5px;">Tổng số lượng sản phẩm, công việc<br/><i style="font-weight: normal; font-size: 8.5pt;">(Ghi tổng số lượng tương ứng)</i></th>
          <th colspan="4" style="border: 1px solid #000; padding: 5px;">Tiến độ sản phẩm, công việc<br/><i style="font-weight: normal; font-size: 8.5pt;">(Ghi tổng số lượng tương ứng)</i></th>
          <th colspan="4" style="border: 1px solid #000; padding: 5px;">Chất lượng sản phẩm, công việc<br/><i style="font-weight: normal; font-size: 8.5pt;">(Ghi tổng số lượng tương ứng)</i></th>
          <th rowspan="2" style="border: 1px solid #000; padding: 5px; width: 60px;">Ghi chú</th>
        </tr>
        <tr style="background-color: #f9f9f9; text-align: center; font-size: 8.5pt;">
          <th style="border: 1px solid #000; padding: 4px;">Được giao</th>
          <th style="border: 1px solid #000; padding: 4px;">Hoàn thành</th>
          <th style="border: 1px solid #000; padding: 4px;">Chưa hoàn thành</th>
          <th style="border: 1px solid #000; padding: 4px; width: 85px;">Tỷ lệ tổng sản phẩm, công việc được giao hoàn thành so với sản phẩm, công việc được giao (%)</th>
          <th style="border: 1px solid #000; padding: 4px;">Sớm hạn</th>
          <th style="border: 1px solid #000; padding: 4px;">Đúng hạn</th>
          <th style="border: 1px solid #000; padding: 4px;">Trễ hạn</th>
          <th style="border: 1px solid #000; padding: 4px; width: 95px;">Tỷ lệ tổng sản phẩm, công việc được giao hoàn thành đúng hạn và sớm hạn so với tổng sản phẩm, công việc được giao (%)</th>
          <th style="border: 1px solid #000; padding: 4px;">Đảm bảo</th>
          <th style="border: 1px solid #000; padding: 4px; width: 80px;">Vượt mức<br/><i style="font-size: 7.5pt; font-weight: normal;">(được cấp có thẩm quyền ghi nhận...)</i></th>
          <th style="border: 1px solid #000; padding: 4px;">Chưa đảm bảo</th>
          <th style="border: 1px solid #000; padding: 4px; width: 95px;">Tỷ lệ tổng sản phẩm, công việc được giao hoàn thành đảm bảo chất lượng trở lên so với tổng sản phẩm, công việc được giao (%)</th>
        </tr>
        <tr style="background-color: #efefef; text-align: center; font-style: italic; font-size: 8pt;">
          <td style="border: 1px solid #000; padding: 2px;">(1)</td>
          <td style="border: 1px solid #000; padding: 2px;">(2)</td>
          <td style="border: 1px solid #000; padding: 2px;">(3)</td>
          <td style="border: 1px solid #000; padding: 2px;">(4) = (2)/(1) X 100</td>
          <td style="border: 1px solid #000; padding: 2px;">(5)</td>
          <td style="border: 1px solid #000; padding: 2px;">(6)</td>
          <td style="border: 1px solid #000; padding: 2px;">(7)</td>
          <td style="border: 1px solid #000; padding: 2px;">(8) = (5+6)/(1) X 100</td>
          <td style="border: 1px solid #000; padding: 2px;">(9)</td>
          <td style="border: 1px solid #000; padding: 2px;">(10)</td>
          <td style="border: 1px solid #000; padding: 2px;">(11)</td>
          <td style="border: 1px solid #000; padding: 2px;">(12) = (9+10)/(1) X 100</td>
          <td style="border: 1px solid #000; padding: 2px;">(13)</td>
        </tr>
      </thead>
      <tbody>
        <tr style="text-align: center; font-weight: bold; font-size: 10pt; height: 28px;">
          <td style="border: 1px solid #000; padding: 4px;">${col1_assigned}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #15803d;">${col2_completed}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col3_uncompleted}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #1d4ed8;">${col4_completionRate}%</td>
          <td style="border: 1px solid #000; padding: 4px;">${col5_early}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col6_onTime}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col7_late}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #1d4ed8;">${col8_onTimeRate}%</td>
          <td style="border: 1px solid #000; padding: 4px;">${col9_satisfactory}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col10_exceeded}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col11_unsatisfactory}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #1d4ed8;">${col12_qualityRate}%</td>
          <td style="border: 1px solid #000; padding: 4px; font-weight: normal; font-size: 8.5pt;">Hoàn thành chỉ tiêu</td>
        </tr>
      </tbody>
    </table>
  `;

  const documentContent = `
    <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Mẫu 01 TKNV - ${teacher.fullName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForCustomXSL/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: 210mm 297mm; /* A4 Portrait */
          margin: 15mm 15mm 15mm 25mm; /* Standard Decree 30 */
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.WordSection1 {
          page: WordSection1;
          font-family: 'Times New Roman', serif;
        }
        p, td, th {
          font-family: 'Times New Roman', serif;
          line-height: 1.25;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        
        <!-- Header Table (Decree 30 Standard Format) -->
        <table style="width: 100%; border: none; margin-bottom: 10pt;">
          <tr>
            <td style="width: 48%; text-align: center; vertical-align: top; font-size: 12pt;">
              <p style="margin: 0; text-transform: uppercase; font-weight: bold;">TRƯỜNG PTDTNT THCS VÀ THPT NƯỚC OA</p>
              <p style="margin: 2pt 0 0 0; text-transform: uppercase; font-weight: bold; text-decoration: underline;">TỔ: ${teacher.department?.toUpperCase() || 'CHUYÊN MÔN'}</p>
            </td>
            <td style="width: 52%; text-align: center; vertical-align: top; font-size: 12pt;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style="margin: 2pt 0 0 0; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</p>
              <p style="margin: 2pt 0 0 0; font-weight: bold;">-------------------</p>
            </td>
          </tr>
          <tr>
            <td style="width: 48%;"></td>
            <td style="width: 52%; text-align: center; font-style: italic; font-size: 12pt; padding-top: 6pt;">
              ${formattedDate}
            </td>
          </tr>
        </table>

        <!-- Document Title -->
        <div style="text-align: center; margin-top: 14pt; margin-bottom: 16pt;">
          <p style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0;">
            BẢNG THỐNG KÊ, TỰ ĐÁNH GIÁ KẾT QUẢ THỰC HIỆN NHIỆM VỤ
          </p>
          <p style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 4pt 0 0 0;">
            THÁNG ${monthStr} NĂM ${year} (MẪU 01 - TKNV)
          </p>
        </div>

        <!-- Personal Info Section -->
        <table style="width: 100%; border: none; margin-bottom: 12pt; font-size: 13pt;">
          <tr>
            <td style="padding: 2pt 0; width: 60%;"><b>Họ và tên:</b> ${teacher.fullName}</td>
            <td style="padding: 2pt 0; width: 40%;"><b>Chức vụ / Chuyên môn:</b> ${teacher.position || teacher.subject || 'Giáo viên'}</td>
          </tr>
          <tr>
            <td style="padding: 2pt 0;"><b>Tổ chuyên môn:</b> ${teacher.department}</td>
            <td style="padding: 2pt 0;"><b>Đơn vị công tác:</b> ${teacher.school || 'Trường PTDTNT THCS và THPT Nước Oa'}</td>
          </tr>
        </table>

        <!-- Main Task Table Categorized -->
        <p style="font-size: 12pt; font-weight: bold; margin-bottom: 4pt;">BẢNG CHI TIẾT DANH MỤC NHIỆM VỤ THÁNG ${monthStr}/${year}:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
          <thead>
            <tr style="background-color: #F2F2F2;">
              <th style="border: 1px solid #000; width: 30px; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">STT</th>
              <th style="border: 1px solid #000; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Nhiệm vụ được giao (I, II, III, IV)</th>
              <th style="border: 1px solid #000; width: 65px; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Tính chất</th>
              <th style="border: 1px solid #000; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Sản phẩm / Chỉ tiêu giao</th>
              <th style="border: 1px solid #000; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Công việc thực hiện & Thời gian</th>
              <th style="border: 1px solid #000; width: 70px; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Mức độ thực hiện</th>
              <th style="border: 1px solid #000; width: 75px; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Chất lượng</th>
              <th style="border: 1px solid #000; width: 50px; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">% Hoàn thành</th>
              <th style="border: 1px solid #000; width: 90px; padding: 6px; font-size: 10pt; font-weight: bold; text-align: center;">Kiến nghị / Minh chứng</th>
            </tr>
          </thead>
          <tbody>
            ${tasksRowsHtml}
          </tbody>
        </table>

        <!-- Summary & Evaluation Section with 13-Column Table -->
        <div style="margin-bottom: 14pt; font-size: 13pt;">
          <p style="margin: 0 0 4pt 0;"><b>I. Đánh giá chung mức độ hoàn thành nhiệm vụ:</b></p>
          
          <p style="margin: 4pt 0 2pt 0; font-size: 11pt; font-weight: bold;">Bảng thống kê tổng hợp kết quả sản phẩm, công việc trong tháng (Thống kê Mẫu 01):</p>
          ${summary13ColTableHtml}

          <div style="border: 1px solid #000; padding: 8pt; background-color: #FAFAFA; font-style: italic; margin-top: 6pt;">
            ${overallSummary || `Trong tháng ${monthStr}/${year}, cá nhân đã hoàn thành ${col2_completed}/${col1_assigned} danh mục nhiệm vụ được giao (đạt ${col4_completionRate}%), đảm bảo tiến độ (${col8_onTimeRate}%) và chất lượng (${col12_qualityRate}%) theo chương trình kế hoạch công tác.`}
          </div>
        </div>

        <div style="margin-bottom: 16pt; font-size: 13pt;">
          <p style="margin: 0 0 4pt 0;"><b>II. Tự xếp loại kết quả thực hiện nhiệm vụ:</b></p>
          <p style="margin: 0; padding-left: 12pt; font-weight: bold; color: #000000;">
            - Mức độ tự xếp loại: <span style="text-transform: uppercase;">${classificationLabel}</span> (Tỷ lệ hoàn thành nhiệm vụ: ${col4_completionRate}%)
          </p>
        </div>

        <!-- 3 Signature Blocks (HIỆU TRƯỞNG - PHT/TTCM - CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ) -->
        <table style="width: 100%; border: none; margin-top: 24pt; page-break-inside: avoid; table-layout: fixed;">
          <tr>
            <td style="width: 33%; text-align: center; vertical-align: top; font-size: 11pt;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase;">HIỆU TRƯỜNG</p>
              <p style="margin: 2pt 0 0 0; font-style: italic; font-size: 10pt;">(Ký, đóng dấu và ghi rõ họ tên)</p>
              <div style="height: 50pt; margin-top: 4pt;">
                ${sigData?.principalSignature ? `<img src="${sigData.principalSignature}" style="max-height: 45pt;" />` : ''}
              </div>
              <p style="margin: 0; font-weight: bold;">${sigData?.principalName || 'Bùi Văn Sáu'}</p>
            </td>
            <td style="width: 34%; text-align: center; vertical-align: top; font-size: 11pt;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase;">PHÓ HIỆU TRƯỜNG (TTCM)</p>
              <p style="margin: 2pt 0 0 0; font-style: italic; font-size: 10pt;">(Xác nhận & ký rõ họ tên)</p>
              <div style="height: 50pt; margin-top: 4pt;">
                ${sigData?.leaderSignature ? `<img src="${sigData.leaderSignature}" style="max-height: 45pt;" />` : ''}
              </div>
              <p style="margin: 0; font-weight: bold;">${sigData?.leaderName || 'Nguyễn Xuân Ảnh'}</p>
            </td>
            <td style="width: 33%; text-align: center; vertical-align: top; font-size: 11pt;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase;">CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ</p>
              <p style="margin: 2pt 0 0 0; font-style: italic; font-size: 10pt;">(Ký và ghi rõ họ tên)</p>
              <div style="height: 50pt; margin-top: 4pt;">
                ${sigData?.evaluatorSignature ? `<img src="${sigData.evaluatorSignature}" style="max-height: 45pt;" />` : ''}
              </div>
              <p style="margin: 0; font-weight: bold;">${sigData?.evaluatorName || teacher.fullName}</p>
            </td>
          </tr>
        </table>

      </div>
    </body>
    </html>
  `;

  // Create Blob and trigger download
  const blob = new Blob(['\ufeff', documentContent], {
    type: 'application/msword;charset=utf-8'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = teacher.fullName.replace(/[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/g, '_');
  a.download = `Mau_01_TKNV_Thang_${monthStr}_${year}_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Triggers interactive Decree 30 printable modal/view for saving as PDF or printing
 */
export const exportForm01ToPdfPrint = (
  teacher: Teacher,
  tasks: Form01Task[],
  month: number,
  year: number,
  overallSummary: string,
  evaluationDate?: string,
  sigData?: SignatureData
) => {
  const dateObj = evaluationDate ? new Date(evaluationDate) : new Date();
  const dayStr = dateObj.getDate() < 10 ? `0${dateObj.getDate()}` : `${dateObj.getDate()}`;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const formattedDate = `Bắc Trà My, ngày ${dayStr} tháng ${monthStr} năm ${year}`;

  // 13-Column Summary Calculations
  const col1_assigned = tasks.length;
  const col2_completed = tasks.filter(t => (t.completionRate || 0) >= 100 || t.status === 'completed').length;
  const col3_uncompleted = col1_assigned - col2_completed;
  const col4_completionRate = col1_assigned > 0 ? Math.round((col2_completed / col1_assigned) * 100) : 100;

  const col5_early = tasks.filter(t => t.progress === 'Trước tiến độ' || t.progress === 'Sớm hạn').length;
  const col6_onTime = tasks.filter(t => !t.progress || t.progress === 'Đúng tiến độ' || t.progress === 'Đúng hạn').length;
  const col7_late = tasks.filter(t => t.progress?.includes('Chậm') || t.progress?.includes('Trễ')).length;
  const col8_onTimeRate = col1_assigned > 0 ? Math.round(((col5_early + col6_onTime) / col1_assigned) * 100) : 100;

  const col9_satisfactory = tasks.filter(t => !t.quality || t.quality === 'Đạt yêu cầu' || t.quality === 'Đảm bảo').length;
  const col10_exceeded = tasks.filter(t => t.quality?.includes('cao') || t.quality?.includes('Vượt')).length;
  const col11_unsatisfactory = tasks.filter(t => t.quality?.includes('Chưa') || t.quality?.includes('Cần')).length;
  const col12_qualityRate = col1_assigned > 0 ? Math.round(((col9_satisfactory + col10_exceeded) / col1_assigned) * 100) : 100;

  let classificationLabel = 'Hoàn thành xuất sắc nhiệm vụ';
  if (col4_completionRate < 50) {
    classificationLabel = 'Không hoàn thành nhiệm vụ';
  } else if (col4_completionRate < 80) {
    classificationLabel = 'Hoàn thành nhiệm vụ';
  } else if (col4_completionRate < 90) {
    classificationLabel = 'Hoàn thành tốt nhiệm vụ';
  }

  const printWindow = window.open('', '_blank', 'width=1050,height=1100');
  if (!printWindow) {
    alert('Vui lòng cho phép mở cửa sổ popup để xuất file PDF Mẫu 01 chuẩn Nghị định 30!');
    return;
  }

  const categories = [
    { key: 'I', title: 'I. Nhiệm vụ theo chương trình, kế hoạch công tác năm' },
    { key: 'II', title: 'II. Nhiệm vụ chuyên môn thường xuyên' },
    { key: 'III', title: 'III. Nhiệm vụ đột xuất, phát sinh' },
    { key: 'IV', title: 'IV. Nhiệm vụ khác và kiêm nhiệm' }
  ];

  let taskGlobalCounter = 0;
  let tasksRowsHtml = '';

  categories.forEach(cat => {
    const catTasks = tasks.filter(t => (t.category || 'II') === cat.key);
    
    tasksRowsHtml += `
      <tr style="background-color: #f0fdf4;">
        <td colspan="9" style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 11pt; text-transform: uppercase; color: #166534;">
          ${cat.title} (${catTasks.length} công việc)
        </td>
      </tr>
    `;

    if (catTasks.length === 0) {
      tasksRowsHtml += `
        <tr>
          <td style="border: 1px solid #000; text-align: center; padding: 4px; font-size: 10pt; color: #666;" colspan="9">
            <i>Không có nhiệm vụ trong kỳ</i>
          </td>
        </tr>
      `;
    } else {
      catTasks.forEach(t => {
        taskGlobalCounter++;
        const workDetail = t.workDone || t.result || 'Đã hoàn thành theo kế hoạch';
        const nature = t.taskNature || 'Thường xuyên';
        const timeStr = t.executionTime ? `<br/><i style="font-size: 10pt; color: #444;">⏱️ ${t.executionTime}</i>` : '';
        const note = t.noteExplanation ? ` / <br/><i>Ghi chú: ${t.noteExplanation}</i>` : '';

        tasksRowsHtml += `
          <tr>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; vertical-align: middle;">${taskGlobalCounter}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top;"><b>${t.taskName || ''}</b></td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 10pt; vertical-align: middle;">${nature}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top;">${t.assignedTarget || ''}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top;">
              ${workDetail}${timeStr}
            </td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; vertical-align: middle;">${t.progress || 'Đúng hạn'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; vertical-align: middle;">${t.quality || 'Đạt yêu cầu'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 6px; font-size: 11pt; font-weight: bold; vertical-align: middle;">${t.completionRate || 100}%</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 10pt; vertical-align: top; word-break: break-all;">
              ${t.evidenceLink ? `<a href="${t.evidenceLink}" target="_blank" style="color: #1a56db; text-decoration: underline;">Minh chứng</a>` : 'Đã đạt'}${note}
            </td>
          </tr>
        `;
      });
    }
  });

  const summary13ColTableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: #f3f4f6; text-align: center; font-weight: bold;">
          <th colspan="4" style="border: 1px solid #000; padding: 5px;">Tổng số lượng sản phẩm, công việc<br/><i style="font-weight: normal; font-size: 8.5pt;">(Ghi tổng số lượng tương ứng)</i></th>
          <th colspan="4" style="border: 1px solid #000; padding: 5px;">Tiến độ sản phẩm, công việc<br/><i style="font-weight: normal; font-size: 8.5pt;">(Ghi tổng số lượng tương ứng)</i></th>
          <th colspan="4" style="border: 1px solid #000; padding: 5px;">Chất lượng sản phẩm, công việc<br/><i style="font-weight: normal; font-size: 8.5pt;">(Ghi tổng số lượng tương ứng)</i></th>
          <th rowspan="2" style="border: 1px solid #000; padding: 5px; width: 60px;">Ghi chú</th>
        </tr>
        <tr style="background-color: #f9fafb; text-align: center; font-size: 8.5pt;">
          <th style="border: 1px solid #000; padding: 4px;">Được giao</th>
          <th style="border: 1px solid #000; padding: 4px;">Hoàn thành</th>
          <th style="border: 1px solid #000; padding: 4px;">Chưa hoàn thành</th>
          <th style="border: 1px solid #000; padding: 4px; width: 85px;">Tỷ lệ tổng sản phẩm, công việc được giao hoàn thành so với sản phẩm, công việc được giao (%)</th>
          <th style="border: 1px solid #000; padding: 4px;">Sớm hạn</th>
          <th style="border: 1px solid #000; padding: 4px;">Đúng hạn</th>
          <th style="border: 1px solid #000; padding: 4px;">Trễ hạn</th>
          <th style="border: 1px solid #000; padding: 4px; width: 95px;">Tỷ lệ tổng sản phẩm, công việc được giao hoàn thành đúng hạn và sớm hạn so với tổng sản phẩm, công việc được giao (%)</th>
          <th style="border: 1px solid #000; padding: 4px;">Đảm bảo</th>
          <th style="border: 1px solid #000; padding: 4px; width: 80px;">Vượt mức<br/><i style="font-size: 7.5pt; font-weight: normal;">(được cấp có thẩm quyền ghi nhận...)</i></th>
          <th style="border: 1px solid #000; padding: 4px;">Chưa đảm bảo</th>
          <th style="border: 1px solid #000; padding: 4px; width: 95px;">Tỷ lệ tổng sản phẩm, công việc được giao hoàn thành đảm bảo chất lượng trở lên so với tổng sản phẩm, công việc được giao (%)</th>
        </tr>
        <tr style="background-color: #f3f4f6; text-align: center; font-style: italic; font-size: 8pt;">
          <td style="border: 1px solid #000; padding: 2px;">(1)</td>
          <td style="border: 1px solid #000; padding: 2px;">(2)</td>
          <td style="border: 1px solid #000; padding: 2px;">(3)</td>
          <td style="border: 1px solid #000; padding: 2px;">(4) = (2)/(1) X 100</td>
          <td style="border: 1px solid #000; padding: 2px;">(5)</td>
          <td style="border: 1px solid #000; padding: 2px;">(6)</td>
          <td style="border: 1px solid #000; padding: 2px;">(7)</td>
          <td style="border: 1px solid #000; padding: 2px;">(8) = (5+6)/(1) X 100</td>
          <td style="border: 1px solid #000; padding: 2px;">(9)</td>
          <td style="border: 1px solid #000; padding: 2px;">(10)</td>
          <td style="border: 1px solid #000; padding: 2px;">(11)</td>
          <td style="border: 1px solid #000; padding: 2px;">(12) = (9+10)/(1) X 100</td>
          <td style="border: 1px solid #000; padding: 2px;">(13)</td>
        </tr>
      </thead>
      <tbody>
        <tr style="text-align: center; font-weight: bold; font-size: 10pt; height: 28px;">
          <td style="border: 1px solid #000; padding: 4px;">${col1_assigned}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #166534;">${col2_completed}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col3_uncompleted}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #1e40af;">${col4_completionRate}%</td>
          <td style="border: 1px solid #000; padding: 4px;">${col5_early}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col6_onTime}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col7_late}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #1e40af;">${col8_onTimeRate}%</td>
          <td style="border: 1px solid #000; padding: 4px;">${col9_satisfactory}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col10_exceeded}</td>
          <td style="border: 1px solid #000; padding: 4px;">${col11_unsatisfactory}</td>
          <td style="border: 1px solid #000; padding: 4px; color: #1e40af;">${col12_qualityRate}%</td>
          <td style="border: 1px solid #000; padding: 4px; font-weight: normal; font-size: 8.5pt;">Hoàn thành chỉ tiêu</td>
        </tr>
      </tbody>
    </table>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Mẫu 01 TKNV - Nghị định 30 - ${teacher.fullName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 20mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.3;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 20px;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .header-table td {
          vertical-align: top;
          text-align: center;
        }
        .doc-title {
          text-align: center;
          margin: 20px 0;
        }
        .doc-title h1 {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
        }
        .doc-title h2 {
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 5px 0 0 0;
        }
        .info-table {
          width: 100%;
          margin-bottom: 15px;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 3px 0;
          font-size: 12pt;
        }
        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .main-table th, .main-table td {
          border: 1px solid #000;
          padding: 6px;
        }
        .main-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          font-size: 10pt;
          text-transform: uppercase;
        }
        .no-print {
          margin-bottom: 20px;
          padding: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-print {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>

      <div class="no-print">
        <span style="font-family: sans-serif; font-size: 14px; color: #1e3a8a; font-weight: bold;">
          📄 Bảng thống kê Mẫu 01 TKNV chuẩn Nghị định 30/2020/NĐ-CP (Kèm Khung chữ ký 3 vị trí)
        </span>
        <button class="btn-print" onclick="window.print()">🖨️ In / Lưu file PDF ngay</button>
      </div>

      <!-- Header Decree 30 -->
      <table class="header-table">
        <tr>
          <td style="width: 48%;">
            <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">TRƯỜNG PTDTNT THCS VÀ THPT NƯỚC OA</div>
            <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt; text-decoration: underline; margin-top: 2px;">TỔ: ${teacher.department?.toUpperCase() || 'CHUYÊN MÔN'}</div>
          </td>
          <td style="width: 52%;">
            <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-weight: bold; font-size: 11pt; margin-top: 2px;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-weight: bold; margin-top: 2px;">-------------------</div>
          </td>
        </tr>
        <tr>
          <td></td>
          <td style="font-style: italic; font-size: 12pt; padding-top: 6px;">
            ${formattedDate}
          </td>
        </tr>
      </table>

      <!-- Title -->
      <div class="doc-title">
        <h1>BẢNG THỐNG KÊ, TỰ ĐÁNH GIÁ KẾT QUẢ THỰC HIỆN NHIỆM VỤ</h1>
        <h2>THÁNG ${monthStr} NĂM ${year} (MẪU 01 - TKNV)</h2>
      </div>

      <!-- Personal Info -->
      <table class="info-table">
        <tr>
          <td style="width: 55%;"><b>Họ và tên:</b> ${teacher.fullName}</td>
          <td style="width: 45%;"><b>Chức vụ / Chuyên môn:</b> ${teacher.position || teacher.subject || 'Giáo viên'}</td>
        </tr>
        <tr>
          <td><b>Tổ chuyên môn:</b> ${teacher.department}</td>
          <td><b>Đơn vị công tác:</b> ${teacher.school || 'Trường PTDTNT THCS và THPT Nước Oa'}</td>
        </tr>
      </table>

      <!-- Main Task Table -->
      <p style="font-size: 12pt; font-weight: bold; margin-bottom: 4px;">BẢNG CHI TIẾT DANH MỤC NHIỆM VỤ THÁNG ${monthStr}/${year}:</p>
      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">STT</th>
            <th style="text-align: center;">Nhiệm vụ được giao (I, II, III, IV)</th>
            <th style="width: 65px; text-align: center;">Tính chất</th>
            <th style="text-align: center;">Sản phẩm / Chỉ tiêu giao</th>
            <th style="text-align: center;">Công việc thực hiện & Thời gian</th>
            <th style="width: 70px; text-align: center;">Mức độ</th>
            <th style="width: 75px; text-align: center;">Chất lượng</th>
            <th style="width: 50px; text-align: center;">% HT</th>
            <th style="width: 90px; text-align: center;">Kiến nghị / Minh chứng</th>
          </tr>
        </thead>
        <tbody>
          ${tasksRowsHtml}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="margin-top: 15px; margin-bottom: 12px;">
        <p style="margin: 0 0 5px 0;"><b>I. Đánh giá chung mức độ hoàn thành nhiệm vụ:</b></p>
        
        <p style="margin: 6px 0 3px 0; font-size: 11pt; font-weight: bold;">Bảng thống kê tổng hợp kết quả sản phẩm, công việc trong tháng (Thống kê Mẫu 01):</p>
        ${summary13ColTableHtml}

        <div style="border: 1px solid #000; padding: 10px; font-style: italic; background: #fafafa; margin-top: 6px;">
          ${overallSummary || `Trong tháng ${monthStr}/${year}, cá nhân đã hoàn thành ${col2_completed}/${col1_assigned} danh mục nhiệm vụ được giao (đạt ${col4_completionRate}%), đảm bảo tiến độ (${col8_onTimeRate}%) và chất lượng (${col12_qualityRate}%) theo chương trình kế hoạch công tác.`}
        </div>
      </div>

      <div style="margin-bottom: 18px;">
        <p style="margin: 0 0 5px 0;"><b>II. Tự xếp loại kết quả thực hiện nhiệm vụ:</b></p>
        <p style="margin: 0; padding-left: 15px; font-weight: bold;">
          - Mức độ tự xếp loại: <span style="text-transform: uppercase;">${classificationLabel}</span> (Tỷ lệ hoàn thành nhiệm vụ: ${col4_completionRate}%)
        </p>
      </div>

      <!-- 3 Signatures Block -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 25px; page-break-inside: avoid; table-layout: fixed;">
        <tr>
          <td style="width: 33%; text-align: center; vertical-align: top; font-size: 11pt;">
            <p style="margin: 0; font-weight: bold; text-transform: uppercase;">HIỆU TRƯỜNG</p>
            <p style="margin: 2px 0 0 0; font-style: italic; font-size: 10pt;">(Ký, đóng dấu và ghi rõ họ tên)</p>
            <div style="height: 55px; margin-top: 5px;">
              ${sigData?.principalSignature ? `<img src="${sigData.principalSignature}" style="max-height: 50px;" />` : ''}
            </div>
            <p style="margin: 0; font-weight: bold;">${sigData?.principalName || 'Bùi Văn Sáu'}</p>
          </td>
          <td style="width: 34%; text-align: center; vertical-align: top; font-size: 11pt;">
            <p style="margin: 0; font-weight: bold; text-transform: uppercase;">PHÓ HIỆU TRƯỜNG (TTCM)</p>
            <p style="margin: 2px 0 0 0; font-style: italic; font-size: 10pt;">(Xác nhận & ký rõ họ tên)</p>
            <div style="height: 55px; margin-top: 5px;">
              ${sigData?.leaderSignature ? `<img src="${sigData.leaderSignature}" style="max-height: 50px;" />` : ''}
            </div>
            <p style="margin: 0; font-weight: bold;">${sigData?.leaderName || 'Nguyễn Xuân Ảnh'}</p>
          </td>
          <td style="width: 33%; text-align: center; vertical-align: top; font-size: 11pt;">
            <p style="margin: 0; font-weight: bold; text-transform: uppercase;">CÁ NHÂN NGƯỜI TỰ ĐÁNH GIÁ</p>
            <p style="margin: 2px 0 0 0; font-style: italic; font-size: 10pt;">(Ký và ghi rõ họ tên)</p>
            <div style="height: 55px; margin-top: 5px;">
              ${sigData?.evaluatorSignature ? `<img src="${sigData.evaluatorSignature}" style="max-height: 50px;" />` : ''}
            </div>
            <p style="margin: 0; font-weight: bold;">${sigData?.evaluatorName || teacher.fullName}</p>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `);

  printWindow.document.close();
};
