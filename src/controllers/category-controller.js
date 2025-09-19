import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import CategoryService from '../services/category-service.js';

const router = Router();
const service = new CategoryService();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const categorias = await service.getAll();
    return res.status(StatusCodes.OK).json({ success: true, data: categorias });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id/carreras', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carreras = await service.getCareersByCategory(id);
    return res.status(StatusCodes.OK).json({ success: true, data: carreras });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

export default router;