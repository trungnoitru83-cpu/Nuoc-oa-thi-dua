import React from 'react';
import { Printer, X, FileText } from 'lucide-react';
import { Teacher, Form01Data, Form03Evaluation } from '../types';
import { FORM_03_CRITERIA, getClassification, getClassificationLabel, getCriteriaForTeacher, isLeaderTeacher } from '../data/form03Criteria';
import { exportToWord, exportForm03ToWord } from '../lib/wordExport';

interface PrintReportViewProps {
  type: 'form01' | 'form03' | 'summary';
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  currentTeacher?: Teacher;
  form01?: Form01Data;
  evaluation?: Form03Evaluation;
  evaluations: Record<string, Form03Evaluation>;
  selectedMonth: number;
  selectedYear?: number;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  type,
  isOpen,
  onClose,
  teachers,
  currentTeacher,
  form01,
  evaluation,
  evaluations,
  selectedMonth,
  selectedYear = 2026
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (type === 'form03' && currentTeacher && evaluation) {
      exportForm03ToWord(currentTeacher, evaluation, selectedMonth, selectedYear);
      return;
    }

    const reportElement = document.getElementById('printable-report-area');
    if (reportElement) {
      const fileName = type === 'form01'
        ? `Mau_01_${currentTeacher?.fullName.replace(/\s+/g, '_')}_Thang_${selectedMonth}_${selectedYear}`
        : `Bang_Tong_Hop_Thi_Dua_36_GV_Thang_${selectedMonth}_${selectedYear}`;

      exportToWord(reportElement.innerHTML, fileName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Floating Action Buttons */}
      <div className="fixed top-4 right-6 z-50 flex items-center gap-2 print:hidden bg-slate-950 text-white backdrop-blur-md p-2.5 rounded-2xl shadow-2xl border-2 border-slate-700">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>In trang này ngay (A4)</span>
        </button>

        <button
          onClick={handleExportWord}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <FileText className="w-4 h-4 text-emerald-200" />
          <span>Xuất file Word (.doc/.docx)</span>
        </button>

        <button
          onClick={onClose}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Paper A4 Page Container */}
      <div id="printable-report-area" className="bg-white text-slate-900 w-full max-w-[800px] min-h-[1050px] p-8 sm:p-12 shadow-2xl rounded-xl print:shadow-none print:w-full print:max-w-none print:p-0 my-8 print:my-0 font-serif">
        
        {/* Document Header (Quốc Hiệu & Tiêu Ngữ) */}
        <div className="flex justify-between items-start text-xs border-b border-slate-300 pb-4 mb-6">
          <div className="text-center font-bold uppercase leading-snug">
            <p>SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>
            <p>TRƯỜNG PTDTBT THCS NƯỚC OA</p>
            <p className="font-normal border-t border-slate-400 mt-1 pt-0.5">Số: ...../TB-TĐNO</p>
          </div>

          <div className="text-center font-bold uppercase leading-snug">
            <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
            <p className="font-normal italic capitalize mt-1">Trà My, ngày 30 tháng {selectedMonth} năm {selectedYear}</p>
          </div>
        </div>

        {/* PRINT FORM 03 DETAILS */}
        {type === 'form03' && currentTeacher && evaluation && (() => {
          const isLeader = isLeaderTeacher(currentTeacher);
          const printCriteria = getCriteriaForTeacher(currentTeacher);

          // Live dynamic recalculation of all parts and sub-points
          let rawPartA_Teacher = 0;
          let rawPartA_Principal = 0;
          let rawPartB_Teacher = 0;
          let rawPartB_Principal = 0;
          let bonus_Teacher = 0;
          let bonus_Principal = 0;
          let deduction_Teacher = 0;
          let deduction_Principal = 0;

          printCriteria.forEach(c => {
            const isBonusOrDed = c.section === 'BONUS' || c.section === 'DEDUCTION';
            const defaultScore = isBonusOrDed ? 0 : c.maxPoints;
            const sc = evaluation.scores?.[c.id] || { teacherScore: defaultScore, principalScore: defaultScore };
            if (c.section === 'A') {
              rawPartA_Teacher += (Number(sc.teacherScore) || 0);
              rawPartA_Principal += (Number(sc.principalScore) || 0);
            } else if (c.section === 'B') {
              rawPartB_Teacher += (Number(sc.teacherScore) || 0);
              rawPartB_Principal += (Number(sc.principalScore) || 0);
            } else if (c.section === 'BONUS') {
              bonus_Teacher += (Number(sc.teacherScore) || 0);
              bonus_Principal += (Number(sc.principalScore) || 0);
            } else if (c.section === 'DEDUCTION') {
              deduction_Teacher += (Number(sc.teacherScore) || 0);
              deduction_Principal += (Number(sc.principalScore) || 0);
            }
          });

          const partA_Teacher = Math.min(30, rawPartA_Teacher);
          const partA_Principal = Math.min(30, rawPartA_Principal);
          const partB_Teacher = Math.min(70, rawPartB_Teacher);
          const partB_Principal = Math.min(70, rawPartB_Principal);

          const grandTotal_Teacher = Math.min(100, Math.max(0, Math.round((partA_Teacher + partB_Teacher + bonus_Teacher - deduction_Teacher) * 100) / 100));
          const grandTotal_Principal = Math.min(100, Math.max(0, Math.round((partA_Principal + partB_Principal + bonus_Principal - deduction_Principal) * 100) / 100));

          const tClass = getClassification(grandTotal_Teacher);
          const pClass = getClassification(grandTotal_Principal);

          return (
            <div>
              <div className="text-center my-6">
                <h1 className="text-base font-bold uppercase tracking-wide text-slate-900">
                  BẢNG ĐÁNH GIÁ VÀ XẾP LOẠI THI ĐUA THÁNG {selectedMonth} NĂM {selectedYear}
                </h1>
                <p className="text-xs italic font-sans text-slate-600 mt-1">
                  ({isLeader ? 'Theo Mẫu số 02 quy định thi đua dành cho Cán bộ quản lý / Tổ trưởng' : 'Theo Mẫu số 03 quy định thi đua ngành giáo dục'})
                </p>
              </div>

              {/* Profile Summary */}
              <div className="text-xs space-y-1.5 mb-6 font-sans bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>1. Họ và tên:</strong> {currentTeacher.fullName}</p>
                  <p><strong>2. Ngày tháng năm sinh:</strong> {currentTeacher.dob}</p>
                  <p><strong>3. Chức vụ / Bộ môn:</strong> {currentTeacher.position ? `${currentTeacher.position} (${currentTeacher.subject})` : currentTeacher.subject}</p>
                  <p><strong>4. Tổ chuyên môn:</strong> {currentTeacher.department}</p>
                </div>
                <p><strong>5. Trường công tác:</strong> {currentTeacher.school}</p>
              </div>

              {/* Criteria Table */}
              <table className="w-full text-xs border-collapse border border-slate-800 mb-6 font-sans">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase text-center border-b border-slate-800">
                    <th className="border border-slate-800 p-2 w-10">STT</th>
                    <th className="border border-slate-800 p-2">Nội dung thi đua đánh giá</th>
                    <th className="border border-slate-800 p-2 w-16">Tối đa</th>
                    <th className="border border-slate-800 p-2 w-24">Cá nhân tự chấm</th>
                    <th className="border border-slate-800 p-2 w-24">HT Duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {/* PHẦN A */}
                  <tr className="font-bold bg-slate-100">
                    <td className="border border-slate-800 p-1.5 text-center">A</td>
                    <td className="border border-slate-800 p-1.5" colSpan={2}>PHẦN A: NHIỆM VỤ CHUNG VÀ CHUYÊN MÔN (TỐI ĐA 30 ĐIỂM)</td>
                    <td className="border border-slate-800 p-1.5 text-center font-black">{partA_Teacher} / 30đ</td>
                    <td className="border border-slate-800 p-1.5 text-center font-black">{partA_Principal} / 30đ</td>
                  </tr>

                  {printCriteria.filter(c => c.section === 'A').map((c, i) => {
                    const sc = evaluation.scores?.[c.id] || { teacherScore: c.maxPoints, principalScore: c.maxPoints };
                    return (
                      <tr key={c.id}>
                        <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                        <td className="border border-slate-800 p-1.5">{c.title}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{c.maxPoints}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{sc.teacherScore}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{sc.principalScore}</td>
                      </tr>
                    );
                  })}

                  {/* PHẦN B */}
                  <tr className="font-bold bg-slate-100">
                    <td className="border border-slate-800 p-1.5 text-center">B</td>
                    <td className="border border-slate-800 p-1.5" colSpan={2}>PHẦN B: NHIỆM VỤ CỤ THỂ VÀ CÔNG TÁC KIÊM NHIỆM (TỐI ĐA 70 ĐIỂM)</td>
                    <td className="border border-slate-800 p-1.5 text-center font-black">{partB_Teacher} / 70đ</td>
                    <td className="border border-slate-800 p-1.5 text-center font-black">{partB_Principal} / 70đ</td>
                  </tr>

                  {printCriteria.filter(c => c.section === 'B').map((c, i) => {
                    const sc = evaluation.scores?.[c.id] || { teacherScore: c.maxPoints, principalScore: c.maxPoints };
                    return (
                      <React.Fragment key={c.id}>
                        <tr className="font-bold bg-slate-50">
                          <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                          <td className="border border-slate-800 p-1.5 font-bold uppercase">{c.title}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{c.maxPoints}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">{sc.teacherScore}đ</td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">{sc.principalScore}đ</td>
                        </tr>
                        {c.tiers && c.tiers.map((tier) => {
                          const isTeacher = sc.teacherScore === tier.points;
                          const isPrincipal = sc.principalScore === tier.points;
                          return (
                            <tr key={tier.code} className="text-[11px]">
                              <td className="border border-slate-800 p-1 text-center font-bold">{tier.code}</td>
                              <td className="border border-slate-800 p-1 pl-2">{tier.label}</td>
                              <td className="border border-slate-800 p-1 text-center">{tier.points}</td>
                              <td className="border border-slate-800 p-1 text-center font-bold text-blue-900">{isTeacher ? `✓ (${tier.points}đ)` : ''}</td>
                              <td className="border border-slate-800 p-1 text-center font-bold text-indigo-900">{isPrincipal ? `✓ (${tier.points}đ)` : ''}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}

                  {/* PHẦN C */}
                  <tr>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">C</td>
                    <td className="border border-slate-800 p-1.5 font-bold">Điểm cộng thi đua (Tổng C.1 + C.2 + C.3 + C.4)</td>
                    <td className="border border-slate-800 p-1.5 text-center">+7</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold text-emerald-800">+{bonus_Teacher}đ</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold text-emerald-800">+{bonus_Principal}đ</td>
                  </tr>

                  {/* PHẦN D */}
                  <tr>
                    <td className="border border-slate-800 p-1.5 text-center font-bold">D</td>
                    <td className="border border-slate-800 p-1.5 font-bold">Điểm trừ thi đua (Tổng D.1 + D.2 + D.3)</td>
                    <td className="border border-slate-800 p-1.5 text-center">-5</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold text-rose-800">-{deduction_Teacher}đ</td>
                    <td className="border border-slate-800 p-1.5 text-center font-bold text-rose-800">-{deduction_Principal}đ</td>
                  </tr>

                  {/* TỔNG A + B */}
                  <tr className="font-extrabold text-xs bg-slate-200">
                    <td className="border border-slate-800 p-2 text-center" colSpan={3}>
                      <div>
                        <p className="font-black text-slate-900 uppercase">
                          TỔNG ĐIỂM THI ĐUA CHUẨN = PHẦN A (TỐI ĐA 30Đ) + PHẦN B (TỐI ĐA 70Đ) = TỐI ĐA 100 ĐIỂM
                        </p>
                        <p className="text-[10px] font-normal text-slate-600 italic mt-0.5">
                          * Điểm cộng (+{bonus_Principal}đ) và điểm trừ (-{deduction_Principal}đ) được thống kê ghi nhận độc lập.
                        </p>
                      </div>
                    </td>
                    <td className="border border-slate-800 p-2 text-center bg-blue-50">
                      <div className="font-black text-sm text-blue-950">{grandTotal_Teacher} ĐIỂM</div>
                      <div className="text-[10px] text-blue-700 font-normal">(A: {partA_Teacher} + B: {partB_Teacher})</div>
                    </td>
                    <td className="border border-slate-800 p-2 text-center bg-indigo-50">
                      <div className="font-black text-sm text-indigo-950">{grandTotal_Principal} ĐIỂM</div>
                      <div className="text-[10px] text-indigo-700 font-normal">(A: {partA_Principal} + B: {partB_Principal})</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Classification text */}
              <div className="text-xs space-y-1 mb-8 font-sans">
                <p>• <strong>Giáo viên tự xếp loại:</strong> {getClassificationLabel(tClass)} ({grandTotal_Teacher} điểm)</p>
                <p>• <strong>Hiệu trưởng phê duyệt xếp loại:</strong> <strong className="uppercase">{getClassificationLabel(pClass)} ({grandTotal_Principal} điểm)</strong></p>
                {evaluation.principalComment && (
                  <p>• <strong>Ý kiến Ban Giám hiệu:</strong> <em>"{evaluation.principalComment}"</em></p>
                )}
              </div>

            {/* Signatures Footer */}
            <div className="grid grid-cols-2 gap-4 text-center text-xs font-sans mt-10">
              <div>
                <p className="font-bold uppercase">GIÁO VIÊN TỰ ĐÁNH GIÁ</p>
                <p className="italic text-[11px]">(Ký, ghi rõ họ tên)</p>
                <div className="h-20 flex items-center justify-center my-1">
                  {evaluation.teacherSignatureImg ? (
                    <img src={evaluation.teacherSignatureImg} alt="Ký tên" className="max-h-16 object-contain" />
                  ) : (
                    <p className="text-slate-400 italic">(Đã ký xác nhận)</p>
                  )}
                </div>
                <p className="font-bold">{currentTeacher.fullName}</p>
              </div>

              <div>
                <p className="font-bold uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</p>
                <p className="italic text-[11px]">(Ký tên và đóng dấu)</p>
                <div className="h-20 flex items-center justify-center my-1">
                  {evaluation.principalSignatureImg ? (
                    <img src={evaluation.principalSignatureImg} alt="Ký tên Hiệu trưởng" className="max-h-16 object-contain" />
                  ) : (
                    <p className="text-slate-400 italic">(Đã phê duyệt)</p>
                  )}
                </div>
                <p className="font-bold">TRƯỜNG PTDTBT THCS NƯỚC OA</p>
              </div>
            </div>
          </div>
        );
      })()}

        {/* PRINT SUMMARY TABLE FOR ALL 34 TEACHERS */}
        {type === 'summary' && (
          <div>
            <div className="text-center my-6">
              <h1 className="text-base font-bold uppercase tracking-wide text-slate-900">
                BẢNG TỔNG HỢP XẾP LOẠI THI ĐUA GIÁO VIÊN THÁNG {selectedMonth} NĂM {selectedYear}
              </h1>
              <p className="text-xs italic font-sans text-slate-600 mt-1">
                Trường PTDTNT THCS và THPT Nước Oa (Tổng số: {teachers.length} Giáo viên)
              </p>
            </div>

            <table className="w-full text-[10px] border-collapse border border-slate-800 mb-8 font-sans">
              <thead>
                <tr className="bg-slate-100 font-bold uppercase text-center border-b border-slate-800">
                  <th className="border border-slate-800 p-1.5 w-6">STT</th>
                  <th className="border border-slate-800 p-1.5 min-w-[120px]">Họ và tên giáo viên</th>
                  <th className="border border-slate-800 p-1.5 w-16">Ngày sinh</th>
                  <th className="border border-slate-800 p-1.5">Bộ môn</th>
                  <th className="border border-slate-800 p-1.5">Tổ chuyên môn</th>
                  <th className="border border-slate-800 p-1.5 w-12 font-bold bg-slate-200">Điểm tự chấm</th>
                  <th className="border border-slate-800 p-1.5 w-10">Điểm A</th>
                  <th className="border border-slate-800 p-1.5 w-10">Điểm B</th>
                  <th className="border border-slate-800 p-1.5 w-10">Cộng</th>
                  <th className="border border-slate-800 p-1.5 w-10">Trừ</th>
                  <th className="border border-slate-800 p-1.5 w-12 font-extrabold">Tổng HT</th>
                  <th className="border border-slate-800 p-1.5 min-w-[110px]">Xếp loại thi đua</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) => {
                  const evKey = `${t.id}_y${selectedYear}_m${selectedMonth}`;
                  const ev = evaluations[evKey] || evaluations[`${t.id}_y2026_m${selectedMonth}`] || evaluations[t.id];
                  const tPartA = Math.min(30, ev?.totalPartA_Teacher ?? 30);
                  const tPartB = Math.min(70, ev?.totalPartB_Teacher ?? 60);
                  const tBonus = ev?.totalBonus_Teacher || 0;
                  const tDed = ev?.totalDeduction_Teacher || 0;
                  const teacherTotal = ev?.grandTotal_Teacher ?? Math.min(100, Math.max(0, Math.round((tPartA + tPartB + tBonus - tDed) * 100) / 100));

                  const partA = Math.min(30, ev ? ev.totalPartA_Principal : 30);
                  const partB = Math.min(70, ev ? ev.totalPartB_Principal : 60);
                  const bonus = ev ? ev.totalBonus_Principal : 0;
                  const ded = ev ? ev.totalDeduction_Principal : 0;
                  const grandTotal = ev ? (ev.grandTotal_Principal ?? Math.min(100, Math.max(0, Math.round((partA + partB + bonus - ded) * 100) / 100))) : Math.min(100, Math.max(0, Math.round((partA + partB) * 100) / 100));
                  const clsLabel = getClassificationLabel(getClassification(grandTotal));

                  return (
                    <tr key={t.id}>
                      <td className="border border-slate-800 p-1 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-800 p-1 font-bold">{t.fullName}</td>
                      <td className="border border-slate-800 p-1 text-center">{t.dob}</td>
                      <td className="border border-slate-800 p-1">{t.subject}</td>
                      <td className="border border-slate-800 p-1">{t.department}</td>
                      <td className="border border-slate-800 p-1 text-center font-bold bg-slate-50">{teacherTotal}</td>
                      <td className="border border-slate-800 p-1 text-center">{partA}</td>
                      <td className="border border-slate-800 p-1 text-center">{partB}</td>
                      <td className="border border-slate-800 p-1 text-center">+{bonus}</td>
                      <td className="border border-slate-800 p-1 text-center">-{ded}</td>
                      <td className="border border-slate-800 p-1 text-center font-extrabold">{grandTotal}</td>
                      <td className="border border-slate-800 p-1 font-bold">{clsLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signatures Footer */}
            <div className="grid grid-cols-2 gap-4 text-center text-xs font-sans mt-8">
              <div>
                <p className="font-bold uppercase">NGƯỜI LẬP BẢNG TỔNG HỢP</p>
                <p className="italic text-[11px]">(Ký, ghi rõ họ tên)</p>
                <div className="h-20" />
                <p className="font-bold">Tổ trưởng chuyên môn</p>
              </div>

              <div>
                <p className="font-bold uppercase">HIỆU TRƯỜNG PHÊ DUYỆT</p>
                <p className="italic text-[11px]">(Ký tên và đóng dấu)</p>
                <div className="h-20" />
                <p className="font-bold">TRƯỜNG PTDTBT THCS NƯỚC OA</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
