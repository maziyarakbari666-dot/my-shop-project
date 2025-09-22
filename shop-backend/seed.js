require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Settings = require('./models/Settings');

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my-shop2';
  await mongoose.connect(mongoUri);

  // Clear minimal
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  const categories = await Category.insertMany([
    { name: 'نان و شیرینی', description: 'محصولات نانوایی' },
    { name: 'لبنیات', description: 'شیر، ماست، پنیر' },
    { name: 'میوه و سبزی', description: 'تازه و سالم' },
    { name: 'نوشیدنی', description: 'سرد و گرم' },
    { name: 'صبحانه', description: 'عسل، مربا، غلات' },
    { name: 'تنقلات', description: 'چیپس، پاپ‌کورن، شکلات' },
    { name: 'خشکبار', description: 'آجیل، میوه خشک' },
  ]);

  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c; });

  await Product.insertMany([
    // Bakery
    { name: 'نان بربری', price: 20000, category: catMap['نان و شیرینی']._id, stock: 120, image: 'https://images.unsplash.com/photo-1605859465655-c0a1b6c6a1b9?auto=format&fit=crop&w=600&q=80', description: 'تازه هر روز صبح' },
    { name: 'نان سنگک', price: 25000, category: catMap['نان و شیرینی']._id, stock: 90, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' },
    { name: 'کروسان کره‌ای', price: 55000, category: catMap['نان و شیرینی']._id, stock: 45, image: 'https://images.unsplash.com/photo-1509440159598-8b9b5f44e8c6?auto=format&fit=crop&w=600&q=80' },
    { name: 'دونات شکلاتی', price: 48000, category: catMap['نان و شیرینی']._id, stock: 60, image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80' },

    // Dairy
    { name: 'پنیر لیقوان', price: 180000, category: catMap['لبنیات']._id, stock: 30, image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80' },
    { name: 'شیر یک لیتری', price: 45000, category: catMap['لبنیات']._id, stock: 50, image: 'https://images.unsplash.com/photo-1580983561371-7f4a2d3f4f7f?auto=format&fit=crop&w=600&q=80' },
    { name: 'ماست پروبیوتیک', price: 65000, category: catMap['لبنیات']._id, stock: 70, image: 'https://images.unsplash.com/photo-1563630423918-6f22eaed3d37?auto=format&fit=crop&w=600&q=80' },
    { name: 'کره محلی', price: 120000, category: catMap['لبنیات']._id, stock: 25, image: 'https://images.unsplash.com/photo-1519629502300-103bba2a19f9?auto=format&fit=crop&w=600&q=80' },

    // Produce
    { name: 'گوجه فرنگی', price: 30000, category: catMap['میوه و سبزی']._id, stock: 100, image: 'https://images.unsplash.com/photo-1546470427-0fdc1dfcf89c?auto=format&fit=crop&w=600&q=80' },
    { name: 'کاهو تازه', price: 25000, category: catMap['میوه و سبزی']._id, stock: 80, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
    { name: 'سیب قرمز', price: 45000, category: catMap['میوه و سبزی']._id, stock: 140, image: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=600&q=80' },
    { name: 'موز درجه یک', price: 70000, category: catMap['میوه و سبزی']._id, stock: 150, image: 'https://images.unsplash.com/photo-1571771685308-18b9e4b4c4a0?auto=format&fit=crop&w=600&q=80' },

    // Beverages
    { name: 'آب معدنی 1.5 لیتری', price: 18000, category: catMap['نوشیدنی']._id, stock: 200, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80' },
    { name: 'آبمیوه پرتقال طبیعی', price: 65000, category: catMap['نوشیدنی']._id, stock: 60, image: 'https://images.unsplash.com/photo-1556679343-c7306c2b4f09?auto=format&fit=crop&w=600&q=80' },
    { name: 'چای ارل گری', price: 95000, category: catMap['نوشیدنی']._id, stock: 90, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80' },
    { name: 'قهوه آسیاب‌شده', price: 220000, category: catMap['نوشیدنی']._id, stock: 35, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80' },

    // Breakfast
    { name: 'عسل طبیعی', price: 320000, category: catMap['صبحانه']._id, stock: 25, image: 'https://images.unsplash.com/photo-1519669417670-68775a50919d?auto=format&fit=crop&w=600&q=80' },
    { name: 'مربای توت فرنگی', price: 85000, category: catMap['صبحانه']._id, stock: 50, image: 'https://images.unsplash.com/photo-1505575972945-2804b55b82df?auto=format&fit=crop&w=600&q=80' },
    { name: 'غلات صبحانه', price: 130000, category: catMap['صبحانه']._id, stock: 70, image: 'https://images.unsplash.com/photo-1505575972945-2804b55b82df?auto=format&fit=crop&w=600&q=80' },
    { name: 'خامه صبحانه', price: 78000, category: catMap['صبحانه']._id, stock: 40, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80' },

    // Snacks
    { name: 'چیپس سیب زمینی', price: 45000, category: catMap['تنقلات']._id, stock: 110, image: 'https://images.unsplash.com/photo-1541599188778-cdc73298e8f8?auto=format&fit=crop&w=600&q=80' },
    { name: 'پاپ‌کورن کره‌ای', price: 52000, category: catMap['تنقلات']._id, stock: 95, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
    { name: 'شکلات تلخ 70%', price: 98000, category: catMap['تنقلات']._id, stock: 60, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' },
    { name: 'بیسکویت کرم‌دار', price: 39000, category: catMap['تنقلات']._id, stock: 120, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },

    // Nuts & Dried Fruits
    { name: 'آجیل مخلوط ویژه', price: 420000, category: catMap['خشکبار']._id, stock: 25, image: 'https://images.unsplash.com/photo-1604909052743-94e9f391cd3e?auto=format&fit=crop&w=600&q=80' },
    { name: 'پسته ممتاز', price: 520000, category: catMap['خشکبار']._id, stock: 20, image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80' },
    { name: 'بادام درختی', price: 360000, category: catMap['خشکبار']._id, stock: 35, image: 'https://images.unsplash.com/photo-1587049352851-cf2b9c8f031e?auto=format&fit=crop&w=600&q=80' },
    { name: 'کشمش پلویی', price: 140000, category: catMap['خشکبار']._id, stock: 60, image: 'https://images.unsplash.com/photo-1615484477861-9f6f12e72694?auto=format&fit=crop&w=600&q=80' },
  ]);

  const day = (d, open, close) => ({ day: d, open, close });
  await Settings.create({
    deliveryZones: [
      { name: 'منطقه 1', fee: 30000 },
      { name: 'منطقه 2', fee: 45000 },
    ],
    dailyHours: [0,1,2,3,4,5,6].map(d => day(d, '08:00', '20:00')),
    payments: { allowOnline: true, allowCOD: true, allowBNPL: true },
  });

  console.log('Seed completed.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });


