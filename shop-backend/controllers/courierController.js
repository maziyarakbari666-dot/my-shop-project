const Courier = require('../models/Courier');

exports.create = async (req, res, next) => {
  try {
    const { name, phone, active } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'نام و تلفن الزامی است' });
    const courier = await Courier.create({ name: String(name).trim(), phone: String(phone).trim(), active: active !== undefined ? !!active : true });
    res.success({ courier });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const onlyActive = String(req.query.active || '').toLowerCase() === 'true';
    const filter = onlyActive ? { active: true } : {};
    const couriers = await Courier.find(filter).sort({ createdAt: -1 });
    res.success({ couriers });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, active } = req.body || {};
    const courier = await Courier.findByIdAndUpdate(id, { $set: { ...(name!==undefined?{ name: String(name).trim() }:{}), ...(phone!==undefined?{ phone: String(phone).trim() }:{}), ...(active!==undefined?{ active: !!active }:{}), } }, { new: true });
    if (!courier) return res.status(404).json({ error: 'پیک یافت نشد' });
    res.success({ courier });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const courier = await Courier.findByIdAndDelete(id);
    if (!courier) return res.status(404).json({ error: 'پیک یافت نشد' });
    res.success({ ok: true });
  } catch (err) { next(err); }
};


