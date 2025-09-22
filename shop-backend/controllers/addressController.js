const Address = require('../models/Address');

exports.list = async (req, res, next) => {
  try {
    const rows = await Address.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.success({ addresses: rows });
  } catch (e) { next(e); }
};

exports.add = async (req, res, next) => {
  try {
    const { line, region, plaque, unit, isDefault } = req.body;
    if (isDefault) await Address.updateMany({ user: req.user.id }, { isDefault: false });
    const row = await Address.create({ user: req.user.id, line, region, plaque, unit, isDefault: !!isDefault });
    res.success({ address: row });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Address.deleteOne({ _id: id, user: req.user.id });
    res.success({ ok: true });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { line, region, plaque, unit, isDefault } = req.body;
    const addr = await Address.findOne({ _id: id, user: req.user.id });
    if (!addr) return res.fail('آدرس یافت نشد.', 404);
    if (typeof line === 'string' && line.trim()) addr.line = line.trim();
    if (typeof region === 'string') addr.region = region;
    if (typeof plaque === 'string') addr.plaque = plaque;
    if (typeof unit === 'string') addr.unit = unit;
    if (typeof isDefault === 'boolean' && isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
      addr.isDefault = true;
    } else if (typeof isDefault === 'boolean') {
      addr.isDefault = isDefault;
    }
    await addr.save();
    res.success({ address: addr });
  } catch (e) { next(e); }
};



