const { v4: uuid } = require('uuid');
const Discount = require('../models/Discount');

async function createDiscountCodeForUser(userId, percent) {
  const code = ('DC-' + uuid().slice(0, 8)).toUpperCase();
  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await Discount.create({ code, user: userId, percent, expiresAt });
  return code;
}

module.exports = { createDiscountCodeForUser };


