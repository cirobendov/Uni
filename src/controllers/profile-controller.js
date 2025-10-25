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

router.get('/secciones-disponibles', authenticateToken, async (req, res) => {
  try {
    const sections = await service.getSeccionesDisponibles();
    return res.status(StatusCodes.OK).json({ success: true, data: sections });
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

router.get('/:userId/expanded', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || Number.isNaN(Number(userId))) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Parámetro userId inválido' });
    }
    
    const profile = await service.getByUserIdExpanded(userId);
    if (!profile) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Perfil no encontrado para el usuario' });
    }
    return res.status(StatusCodes.OK).json({ success: true, data: profile });
  } catch (error) {
    const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(status).json({ success: false, message: error.message });
  }
});


router.post('/section', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const perfil = await service.getProfileId(userId);
    if (!perfil || !perfil.id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Perfil no encontrado para el usuario' });
    }

    const inserted = await service.addSection(req.body, perfil.id);
    return res.status(StatusCodes.CREATED).json({ success: true, data: inserted });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
});

router.put('/section/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // id = id_perfil_x_seccion
    if (!id || Number.isNaN(Number(id))) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Parámetro id inválido' });
    }

    const perfil = await service.getProfileId(userId);
    if (!perfil || !perfil.id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Perfil no encontrado para el usuario' });
    }

    const updated = await service.updateSection(Number(id), req.body, perfil.id);
    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Sección no encontrada o no pertenece al perfil' });
    }

    return res.status(StatusCodes.OK).json({ success: true, data: updated });
  } catch (error) {
    const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(status).json({ success: false, message: error.message });
  }
});

router.delete('/section/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // id = id_perfil_x_seccion
    if (!id || Number.isNaN(Number(id))) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Parámetro id inválido' });
    }

    const perfil = await service.getProfileId(userId);
    if (!perfil || !perfil.id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Perfil no encontrado para el usuario' });
    }

    const deleted = await service.deleteSection(Number(id), perfil.id);
    if (!deleted) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Sección no encontrada o no pertenece al perfil' });
    }

    return res.status(StatusCodes.OK).json({ success: true, data: deleted });
  } catch (error) {
    const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(status).json({ success: false, message: error.message });
  }
});

export default router;