const Settings = require('../models/Settings');

exports.getSettings = async (req, res, next) => {
  try {
    let s = await Settings.findOne().sort({ createdAt: -1 });
    if (!s) {
      s = await Settings.create({
        deliveryZones: [
          { name: 'منطقه 1', fee: 35000 },
          { name: 'منطقه 2', fee: 45000 },
          { name: 'منطقه 3', fee: 55000 }
        ],
        dailyHours: [
          { day: 0, open: '08:00', close: '18:00' },
          { day: 1, open: '08:00', close: '18:00' },
          { day: 2, open: '08:00', close: '18:00' },
          { day: 3, open: '08:00', close: '18:00' },
          { day: 4, open: '08:00', close: '18:00' },
          { day: 5, open: '09:00', close: '16:00' },
          { day: 6, open: '09:00', close: '14:00' }
        ],
        payments: { allowOnline: true, allowCOD: true, allowBNPL: true },
        bnpl: { minCartTotal: 700000, maxCartTotal: 2000000, maxActivePlans: 30 },
        hero: {
          title: 'بیگ‌بیر - سوپرمارکت آنلاین',
          subtitle: 'تازه‌ترین محصولات، ارسال سریع، پرداخت اعتباری',
          slides: []
        },
        about: { contentHtml: '' },
        contact: { phone: '', address: '', instagram: '', email: '' },
        footer: { textHtml: '', links: [] }
      });
    }
    // Provide safe defaults for footer in response if missing/empty
    const obj = s.toObject ? s.toObject() : s;
    if (!obj.footer || !Array.isArray(obj.footer.links) || obj.footer.links.length === 0) {
      obj.footer = {
        textHtml: obj.footer?.textHtml || '© تمامی حقوق برای بیگ‌بیر محفوظ است.',
        links: [
          { label: 'درباره ما', href: '/about' },
          { label: 'تماس با ما', href: '/contact' },
          { label: 'شرایط استفاده', href: '/terms' },
          { label: 'راهنما', href: '/help' }
        ]
      };
    }
    res.success({ settings: obj });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { deliveryZones, dailyHours, payments, bnpl, hero, about, contact, footer } = req.body;
    const s = await Settings.findOne();
    if (!s) {
      const created = await Settings.create({ deliveryZones, dailyHours, payments, bnpl, hero, about, contact, footer });
      return res.success({ settings: created });
    }
    if (deliveryZones) s.deliveryZones = deliveryZones;
    if (dailyHours) s.dailyHours = dailyHours;
    if (payments) s.payments = { ...s.payments.toObject?.() || s.payments || {}, ...payments };
    if (bnpl) s.bnpl = { ...(s.bnpl||{}), ...bnpl };
    if (hero) s.hero = { ...(s.hero||{}), ...hero };
    if (about) s.about = { ...(s.about||{}), ...about };
    if (contact) s.contact = { ...(s.contact||{}), ...contact };
    if (footer) s.footer = { ...(s.footer||{}), ...footer };
    await s.save();
    res.success({ settings: s });
  } catch (err) { next(err); }
};



