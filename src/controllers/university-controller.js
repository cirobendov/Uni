import { Router } from 'express';
import UniversityService from '../services/university-service.js';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';

const router = Router();
const service = new UniversityService();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const universidades = await service.getAll();
    return res.status(StatusCodes.OK).json({ success: true, data: universidades });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/expanded', authenticateToken, async (req, res) => {
  try {
    const universidades = await service.getAllExpanded();
    return res.status(StatusCodes.OK).json({ success: true, data: universidades });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const universidad = await service.getById(Number(id));
    if (!universidad) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Universidad no encontrada' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: universidad });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id/carreras', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carreras = await service.getCarrerasByUniversidad(Number(id));
    if (carreras === null) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Universidad no encontrada' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: carreras });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id/carreras-with-categorias', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carreras = await service.getCarrerasWithCategorias(Number(id));
    if (carreras === null) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Universidad no encontrada' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: carreras });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

export default router;
