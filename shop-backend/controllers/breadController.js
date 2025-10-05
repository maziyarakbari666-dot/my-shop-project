const BreadAvailability = require('../models/BreadAvailability');
const Product = require('../models/Product');

function parseISODateOnly(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  } catch {
    return null;
  }
}

exports.listAvailability = async (req, res, next) => {
  try {
    const { date, productId } = req.query;
    if (!date) return res.fail('پارامتر تاریخ الزامی است (YYYY-MM-DD).', 400);
    const day = parseISODateOnly(date);
    if (!day) return res.fail('تاریخ نامعتبر است.', 400);

    // Optional: filter by product; default to a product that includes "نان" in name
    let pid = productId;
    if (!pid) {
      const p = await Product.findOne({ name: /نان/i });
      if (p) pid = String(p._id);
    }

    const startOfDay = new Date(day);
    const endOfDay = new Date(day); endOfDay.setHours(23,59,59,999);

    const filter = { date: { $gte: startOfDay, $lte: endOfDay } };
    if (pid) filter.productId = pid;

    const items = await BreadAvailability.find(filter).sort({ fromTime: 1 });
    const now = new Date();
    const list = items.map(i => ({
      from: i.fromTime,
      to: i.toTime,
      isAvailable: i.isAvailable && (i.sold < (i.quantity||0)) && now >= i.fromTime && now <= i.toTime ? true : i.isAvailable && now < i.fromTime,
      quantity: i.quantity,
      sold: i.sold
    }));
    res.json(list);
  } catch (err) { next(err); }
}





