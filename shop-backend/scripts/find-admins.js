/*
 List admin users and infer phone numbers from otp-style emails.
 Usage: node shop-backend/scripts/find-admins.js
*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/shop';
  const User = require('../models/User');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (e) {
    console.error('Mongo connection failed:', e.message);
    process.exit(1);
  }
  try {
    const admins = await User.find({ role: 'admin' }).select('name email role').lean();
    if (!admins || admins.length === 0) {
      console.log('No admins found.');
      process.exit(0);
    }
    const mapped = admins.map(a => {
      let inferredPhone = null;
      if (a?.email && a.email.endsWith('@otp.local')) {
        inferredPhone = a.email.split('@')[0];
      } else if (a?.name && /^09\d{9}$/.test(a.name)) {
        inferredPhone = a.name;
      }
      return { id: String(a._id || ''), name: a.name, email: a.email, role: a.role, phone: inferredPhone };
    });
    console.log(JSON.stringify({ admins: mapped }, null, 2));
  } catch (e) {
    console.error('Query failed:', e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(()=>{});
  }
}

main();


