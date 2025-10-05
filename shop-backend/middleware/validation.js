const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      const shape = { body: req.body, query: req.query, params: req.params };
      const parsed = schema.parse(shape);
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;
      next();
    } catch (err) {
      const message = err?.issues?.map(i => i.message).join(' | ') || 'ورودی نامعتبر است';
      return res.fail(message, 422);
    }
  };
}

// Schemas
const authSchemas = {
  signup: z.object({
    body: z.object({
      name: z.string().min(2, 'نام حداقل ۲ کاراکتر'),
      email: z.string().email('ایمیل نامعتبر'),
      password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر'),
      phone: z.string().optional()
    })
  }),
  login: z.object({
    body: z.object({
      email: z.string().email('ایمیل نامعتبر'),
      password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر')
    })
  }),
  sendOtp: z.object({ body: z.object({ phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر') }) }),
  verifyOtp: z.object({ body: z.object({ phone: z.string(), code: z.string().length(6), name: z.string().optional() }) })
};

const productSchemas = {
  add: z.object({
    body: z.object({
      name: z.string().min(2),
      price: z.coerce.number().nonnegative(),
      category: z.string(),
      description: z.string().optional(),
      stock: z.coerce.number().int().nonnegative().default(0),
      discountPercent: z.coerce.number().min(0).max(100).default(0)
    })
  }),
  list: z.object({
    query: z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(200).default(20)
    }).partial()
  })
};

const orderSchemas = {
  create: z.object({
    body: z.object({
      products: z.array(z.object({ product: z.string(), quantity: z.coerce.number().int().positive(), price: z.coerce.number().nonnegative().optional() })).min(1),
      address: z.string().optional(),
      region: z.string().optional(),
      plaque: z.string().optional(),
      unit: z.string().optional(),
      contactPhone: z.string().optional(),
      contactName: z.string().optional(),
      deliveryDate: z.union([z.string(), z.date()]).optional(),
      deliverySlot: z.string().optional(),
      deliveryFee: z.coerce.number().nonnegative().optional(),
      discount: z.coerce.number().nonnegative().optional(),
      paymentMethod: z.enum(['online', 'cod', 'bnpl']).optional()
    })
  })
};

module.exports = { validate, authSchemas, productSchemas, orderSchemas };




