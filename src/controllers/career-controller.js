import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import CareerService from '../services/career-service.js';

const router = Router();
const service = new CareerService();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const carreras = await service.getAll();
    return res.status(StatusCodes.OK).json({ success: true, data: carreras });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carrera = await service.getById(Number(id));
    if (!carrera) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Carrera no encontrada' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: carrera });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.get('/careers-by-category/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carreras = await service.getCarrerasByCategoria(Number(id));
    if (carreras === null) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Universidad no encontrada' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: carreras });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});


export default router;
