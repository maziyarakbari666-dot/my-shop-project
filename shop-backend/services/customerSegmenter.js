const User = require('../models/User');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function getLoyalUsers() {
  const fromDate = daysAgo(7);
  return User.find({
    totalOrders: { $gte: 3 },
    lastOrderDate: { $gte: fromDate },
  }).lean();
}

async function getInactiveUsers() {
  const fromDate = daysAgo(14);
  return User.find({
    lastOrderDate: { $lt: fromDate },
  }).lean();
}

async function getUsersForSurvey() {
  return User.find({
    totalOrders: { $gte: 2 },
  }).lean();
}

module.exports = {
  getLoyalUsers,
  getInactiveUsers,
  getUsersForSurvey,
};





