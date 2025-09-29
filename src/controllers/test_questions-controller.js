import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth-middleware.js';
import TestQuestionsService from '../services/test_questions-service.js';

const router = Router();
const service = new TestQuestionsService();

// GET /preguntas - Devuelve todas las preguntas con sus categorías y carreras asociadas
router.get('/preguntas', authenticateToken, async (req, res) => {
  try {
    const preguntas = await service.getAllPreguntasWithCategoriasAndCarreras();
    return res.status(StatusCodes.OK).json({ 
      success: true, 
      data: preguntas,
      total: preguntas.length 
    });
  } catch (error) {
    const statusCode = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// POST /respuestas - Guarda las respuestas del usuario
router.post('/respuestas', authenticateToken, async (req, res) => {
  try {
    const { respuestas } = req.body;
    const idUsuario = req.user.id;
    
    if (!respuestas) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'El campo "respuestas" es requerido'
      });
    }

    // Agregar id_usuario a cada respuesta desde el token
    const respuestasConUsuario = respuestas.map(respuesta => ({
      ...respuesta,
      id_usuario: idUsuario
    }));

    const result = await service.saveRespuestas(respuestasConUsuario);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: result.message,
      data: { respuestas_guardadas: respuestas.length }
    });
  } catch (error) {
    const statusCode = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// GET /resultados - Calcula y devuelve carreras recomendadas del usuario autenticado
router.get('/resultados', authenticateToken, async (req, res) => {
  try {
    const idUsuario = req.user.id;
    
    if (!idUsuario) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'ID de usuario no encontrado en el token'
      });
    }

    const resultados = await service.calcularResultados(idUsuario);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      data: resultados
    });
  } catch (error) {
    const statusCode = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoints adicionales para compatibilidad
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
