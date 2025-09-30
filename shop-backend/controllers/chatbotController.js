const { chatCompletion } = require('../services/openai');
const mongoose = require('mongoose');

const ChatLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  response: String,
  flagged: { type: Boolean, default: false },
}, { timestamps: true });

const ChatLog = mongoose.models.ChatLog || mongoose.model('ChatLog', ChatLogSchema);

exports.handle = async (req, res, next) => {
  try {
    const { message, context = {} } = req.body || {};
    if (!message) return res.fail('message الزامی است.', 400);

    const system = `You are a helpful customer support assistant for an online shop.
Only answer with public, non-sensitive information. If the question requires accessing private user data and no userId/orderId is provided in context, reply with: "Let me connect you to a human agent" and set flagged=true.
If the question is about order status and context has orderId, answer briefly.
Return only the assistant message as plain text.`;

    const msg = await chatCompletion([
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ message, context }) },
    ], { temperature: 0.4 });

    const text = msg?.content || 'Let me connect you to a human agent';
    const flagged = /human agent/i.test(text) || /connect you/i.test(text);

    await ChatLog.create({ userId: context.userId || null, message, response: text, flagged });
    res.success({ message: text, flagged });
  } catch (err) { next(err); }
};

exports.model = ChatLog;


