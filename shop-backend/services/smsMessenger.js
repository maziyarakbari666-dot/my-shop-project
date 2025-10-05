const { sendSms } = require('./sms');

async function sendLoyalUserCoupon(user, code) {
  const name = user?.name ? String(user.name).trim() : '';
  const message = `سلام ${name || 'دوست عزیز'}!\nاز خریدهای اخیرت ممنونیم 🌟\nکد تخفیف مخصوص شما: ${code}`;
  const to = user?.phoneNumber || user?.phone || user?.contactPhone;
  return await sendSms(to, message);
}

async function sendInactiveUserReminder(user, code) {
  const name = user?.name ? String(user.name).trim() : '';
  const message = `سلام ${name || 'دوست عزیز'}!\nمدتیه ازت خبری نیست 😢\nاین کد تخفیف برات آماده‌ست: ${code || 'WELCOME10'}`;
  const to = user?.phoneNumber || user?.phone || user?.contactPhone;
  return await sendSms(to, message);
}

async function sendSurveyRequest(user) {
  const name = user?.name ? String(user.name).trim() : '';
  const message = `سلام ${name || 'دوست عزیز'} جان 🌟\nنظرت درباره خریدات برامون مهمه 🙏\nاینم لینک نظرسنجی:\nhttps://yourdomain.com/survey?uid=${user?.id || user?._id}`;
  const to = user?.phoneNumber || user?.phone || user?.contactPhone;
  return await sendSms(to, message);
}

module.exports = {
  sendLoyalUserCoupon,
  sendInactiveUserReminder,
  sendSurveyRequest,
};





