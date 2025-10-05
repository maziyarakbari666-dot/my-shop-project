const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { chatCompletion } = require('../services/openai');

function buildSystemPrompt() {
  return (
`You are an AI admin assistant for an e-commerce backend. 
You receive a JSON with fields: prompt (string), context (object with userId, actionType, etc.).
Your job: Convert the prompt to a structured JSON intent with this schema:
{
  "intent": "query|create|update|delete|report",
  "entity": "order|product|category|analytics|other",
  "filters": { ... },
  "data": { ... },
  "needsConfirmation": boolean,
  "output": "json|markdown-table"
}

Rules:
- If user asks to fetch data (e.g., pending orders this week), intent=query.
- For creating product, intent=create, entity=product, include name, price, category (by name if needed).
- For trending products, entity=analytics and intent=query.
- If a write operation is requested, set needsConfirmation=true unless context.actionType === 'confirmed'.
- Prefer concise filters like { status: 'pending', dateRange: { from, to } }.
- Output the JSON only, no extra text.
`);
}

async function mapIntentToOperation(intent, req) {
  const { intent: type, entity, filters = {}, data = {}, needsConfirmation, output } = intent;

  if (needsConfirmation && req.body?.context?.actionType !== 'confirmed' && type !== 'query') {
    return { confirmationRequired: true, message: 'برای انجام این عملیات تایید لازم است.' };
  }

  // Handle queries
  if (type === 'query' && entity === 'order') {
    const q = {};
    if (filters.status) q.status = filters.status;
    // Weekly range
    if (filters.dateRange?.from || filters.dateRange?.to) {
      q.createdAt = {};
      if (filters.dateRange.from) q.createdAt.$gte = new Date(filters.dateRange.from);
      if (filters.dateRange.to) q.createdAt.$lte = new Date(filters.dateRange.to);
    }
    const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200).lean();
    return { result: { orders } };
  }

  if (type === 'query' && (entity === 'product' || entity === 'analytics')) {
    // simple trending: top products by appearance in orders last 30 days
    if ((filters.metric === 'trending' || req.body.prompt?.toLowerCase().includes('trending')) && filters.lastDays) {
      const from = new Date(Date.now() - (Number(filters.lastDays) || 30) * 24 * 60 * 60 * 1000);
      const orders = await Order.find({ createdAt: { $gte: from } }).populate('products.product').lean();
      const counter = new Map();
      for (const o of orders) {
        for (const line of o.products || []) {
          const id = String(line.product?._id || line.product);
          counter.set(id, (counter.get(id) || 0) + Number(line.quantity || 0));
        }
      }
      const arr = Array.from(counter.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20);
      const ids = arr.map(([id]) => id);
      const prods = await Product.find({ _id: { $in: ids } }).lean();
      const byId = new Map(prods.map(p => [String(p._id), p]));
      const rows = arr.map(([id, score]) => ({ score, ...byId.get(id) }));
      return { result: { trending: rows } };
    }
    // default: list products with optional filters
    const q = {};
    if (filters.category) q.category = filters.category;
    if (filters.name) q.name = new RegExp(String(filters.name), 'i');
    const products = await Product.find(q).limit(200).lean();
    return { result: { products } };
  }

  // Create product
  if (type === 'create' && entity === 'product') {
    let categoryId = data.category;
    if (!categoryId && data.categoryName) {
      const cat = await Category.findOne({ name: data.categoryName });
      if (cat) categoryId = cat._id;
    }
    if (!data.name || !data.price || !categoryId) {
      return { error: 'name, price و category الزامی است.' };
    }
    const product = await Product.create({ name: data.name, price: data.price, category: categoryId, description: data.description, stock: data.stock || 0 });
    return { result: { product } };
  }

  return { error: 'Intent not supported' };
}

exports.handle = async (req, res, next) => {
  try {
    const { prompt, context = {} } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.fail('prompt الزامی است.', 400);

    const system = buildSystemPrompt();
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ prompt, context }) },
    ];
    const msg = await chatCompletion(messages, { temperature: 0.1, response_format: { type: 'json_object' } });
    let intent = null;
    try {
      intent = JSON.parse(msg.content || '{}');
    } catch (_) {
      intent = { intent: 'query', entity: 'other', output: 'json' };
    }

    const op = await mapIntentToOperation(intent, req);
    if (op.confirmationRequired) return res.success({ confirmationRequired: true, intent });
    if (op.error) return res.fail(op.error, 400);
    return res.success({ intent, ...op.result });
  } catch (err) { next(err); }
};




