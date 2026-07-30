/**
 * AI Chatbot Controller
 * Uses Groq (free) with Llama 3 for fast gift recommendations
 */

const Groq = require('groq-sdk');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fetch product context from DB for AI
const getProductContext = async () => {
  const products = await db.query(
    `SELECT p.id, p.name, p.price, p.sale_price, p.occasion, p.avg_rating,
      c.name as category,
      COALESCE(i.quantity, 0) as stock
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE p.is_active = TRUE AND COALESCE(i.quantity, 0) > 0
     ORDER BY p.is_featured DESC, p.avg_rating DESC
     LIMIT 50`
  );
  return products;
};

const SYSTEM_PROMPT = (productContext, userName) => `
You are "Aria", the friendly AI gift assistant for Craft Corner, a premium gift box store in India.

Your role:
- Help customers find the perfect gift
- Recommend products from our catalog based on budget, occasion, relationship, age, gender
- Answer FAQs about shipping, returns, customization
- Help track orders (ask for order number)
- Suggest personalized gift combinations

Customer: ${userName || 'Guest'}

Our current product catalog (in JSON):
${JSON.stringify(productContext, null, 2)}

Guidelines:
- Always recommend from the available catalog above
- Be warm, enthusiastic, and concise
- Mention prices in Indian Rupees (₹)
- If asked about out-of-stock items, suggest alternatives
- For order tracking, ask for their order number
- For returns/refunds, direct to: support@craftcorner.in
- Keep responses under 200 words unless listing products
- Format product recommendations as a numbered list with name, price, and why it's perfect

Do NOT:
- Make up products not in the catalog
- Promise delivery times you don't know
- Share other customers information
`;

// ─── Chat ─────────────────────────────────────────────────────────────────────
exports.chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null;
    const session = sessionId || uuidv4();

    // Get conversation history (last 10 messages)
    const history = await db.query(
      'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 10',
      [session]
    );

    // Get product context from DB
    const products = await getProductContext();

    // Get user name if logged in
    let userName = null;
    if (userId) {
      const [user] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
      userName = user?.name;
    }

    // Build messages array for Groq
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT(products, userName),
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',  // Free, fast Llama 3 model
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0].message.content;

    // Save both messages to DB
    await db.query(
      'INSERT INTO chat_messages (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [userId, session, 'user', message]
    );
    await db.query(
      'INSERT INTO chat_messages (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [userId, session, 'assistant', assistantMessage]
    );

    res.status(200).json({
      success: true,
      message: assistantMessage,
      sessionId: session,
    });
  } catch (err) {
    console.error('Groq error:', err.message);

    // Fallback response if Groq fails
    res.status(200).json({
      success: true,
      message: "Hi! I'm Aria 🎁 I'm having a small technical moment. Please try again shortly, or browse our wonderful collection directly!",
      sessionId: req.body.sessionId || uuidv4(),
    });
  }
};

// ─── Get Chat History ─────────────────────────────────────────────────────────
exports.getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const messages = await db.query(
      'SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
    res.status(200).json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};