const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatbot.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({ windowMs: 60000, max: 30, message: { success: false, message: 'Too many messages.' } });
router.post('/chat', chatLimiter, optionalAuth, ctrl.chat);
router.get('/history/:sessionId', ctrl.getChatHistory);
module.exports = router;
