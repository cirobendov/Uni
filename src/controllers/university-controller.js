import { Router } from 'express';
import UniversityService from '../services/university-service.js';
import CareerService from '../services/career-service.js';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';

const router = Router();
const service = new UniversityService();
const careerService = new CareerService();

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

// Add an existing career to a university
router.post('/carreras', authenticateToken, async (req, res) => {
  try {
    const { id: idUsuario } = req.user; // Get user ID from the token
    const { idCarrera, ...carreraData } = req.body;

    // Verify that the user is a university
    if (req.user.tipo !== 'Universidad') {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        success: false, 
        message: 'Solo las universidades pueden agregar carreras' 
      });
    }

    // Validate required fields
    if (!idCarrera) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'El ID de la carrera es requerido'
      });
    }

    const result = await careerService.asociarCarreraAUniversidad(idCarrera, idUsuario, carreraData);
    
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Carrera creada exitosamente',
      data: result
    });
    
  } catch (error) {
    const statusCode = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;
