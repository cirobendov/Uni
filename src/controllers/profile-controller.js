import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import ProfileService from '../services/profile-service.js';

const router = Router();
const service = new ProfileService();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const profiles = await service.getAll();
    return res.status(StatusCodes.OK).json({ success: true, data: profiles });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/expanded', authenticateToken, async (req, res) => {
  try {
    const profiles = await service.getAllExpanded();
    return res.status(StatusCodes.OK).json({ success: true, data: profiles });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id/expanded', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await service.getByIdExpanded(id);
    if (!profile) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Perfil no encontrado' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: profile });
  } catch (error) {
    const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(status).json({ success: false, message: error.message });
  }
});

export default router;