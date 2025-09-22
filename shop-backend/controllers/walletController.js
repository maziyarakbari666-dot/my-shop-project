const Wallet = require('../models/Wallet');

async function getOrCreate(userId) {
  let w = await Wallet.findOne({ user: userId });
  if (!w) w = await Wallet.create({ user: userId, balance: 0, transactions: [] });
  return w;
}

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await getOrCreate(req.user.id);
    res.success({ wallet });
  } catch (err) { next(err); }
};

exports.deposit = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount) || 0;
    if (amount <= 0) return res.fail('مبلغ نامعتبر است.', 400);
    const wallet = await getOrCreate(req.user.id);
    wallet.balance += amount;
    wallet.transactions.push({ type: 'deposit', amount, ref: req.body.ref });
    await wallet.save();
    res.success({ wallet });
  } catch (err) { next(err); }
};

exports.refund = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount) || 0;
    if (amount <= 0) return res.fail('مبلغ نامعتبر است.', 400);
    const wallet = await getOrCreate(req.user.id);
    wallet.balance += amount;
    wallet.transactions.push({ type: 'refund', amount, ref: req.body.ref });
    await wallet.save();
    res.success({ wallet });
  } catch (err) { next(err); }
};






