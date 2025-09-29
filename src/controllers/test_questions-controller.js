import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import TestQuestionsService from '../services/test_questions-service.js';

const router = Router();
const service = new TestQuestionsService();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const testQuestions = await service.getAll();
    return res.status(StatusCodes.OK).json({ success: true, data: testQuestions });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const testQuestion = await service.getById(Number(id));
    if (!testQuestion) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Pregunta de test no encontrada' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: testQuestion });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

export default router;
