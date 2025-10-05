const adminController = require('./adminController');

exports.dailyHtmlReport = async (req, res, next) => {
  try {
    // reuse analyticsDaily
    const fakeReq = { query: { from: req.query.from, to: req.query.to } };
    const capture = {};
    const fakeRes = {
      success: (data) => Object.assign(capture, data),
      fail: (msg, code) => ({ error: msg, code: code || 500 })
    };
    await adminController.analyticsDaily(fakeReq, fakeRes, next);
    const rows = capture.rows || [];
    const html = `<!doctype html><html lang="fa"><head><meta charset="utf-8"/><title>گزارش روزانه</title><style>body{font-family:sans-serif;direction:rtl;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f3f4f6}</style></head><body><h1>گزارش روزانه فروش</h1><table><thead><tr><th>تاریخ</th><th>تعداد</th><th>درآمد</th><th>BNPL</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.date}</td><td>${r.count}</td><td>${r.revenue}</td><td>${r.bnpl}</td></tr>`).join('')}</tbody></table></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) { next(err); }
};




