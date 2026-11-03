/**
 * Vercel Serverless Function / Server-side API endpoint for Google Sheets sync
 * Bypasses browser CORS restrictions, follows redirects, and returns authentic verification.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      synced: false,
      message: 'Chỉ chấp nhận phương thức POST'
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const targetUrl = process.env.VITE_GOOGLE_SHEET_API_URL || 
                      process.env.GOOGLE_SHEET_API_URL ||
                      'https://script.google.com/macros/s/AKfycbxJ6W8LVbLONmyqMK1xIXIKTF3ewcLHvmuTvLMxn6qYItk8SWHarDZxVn454euN0G3W/exec';

    const gasRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const text = await gasRes.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const isSuccess = gasRes.ok && (data.success === true || data.status === 'success' || (data.maChamDiem && !data.error));

    return res.status(isSuccess ? 200 : 400).json({
      success: isSuccess,
      synced: isSuccess,
      evaluationId: payload.evaluationId || payload.maChamDiem || `${payload.ma_thi_dua}_${payload.nam}_${payload.thang}`,
      teacherId: payload.ma_thi_dua || payload.teacherId,
      month: payload.thang,
      year: payload.nam,
      message: isSuccess 
        ? (data.message || 'Đồng bộ Google Sheets thành công') 
        : (data.message || data.error || 'Google Apps Script trả về lỗi xác thực'),
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      synced: false,
      message: `Lỗi kết nối tới Google Apps Script: ${error?.message || error}`
    });
  }
}
