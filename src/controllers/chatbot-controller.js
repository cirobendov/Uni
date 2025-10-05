import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import ChatbotService from '../services/chatbot-service.js';

const router = Router();
const service = new ChatbotService();

// Endpoint principal del chatbot vocacional
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body || {};
    const result = await service.handleMessage(message);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

export default router;
