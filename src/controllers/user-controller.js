import { Router } from 'express';
import UserService from '../services/user-service.js';

const router = Router();
const svc = new UserService();

router.post('/registro', async (req, res) => {
  const usuario = await svc.registro(req.body);
  res.status(201).json(usuario);
});

router.post('/login', async (req, res) => {
  const { mail, contraseña } = req.body;
  const usuario = await svc.login(mail, contraseña);
  if (usuario) res.status(200).json(usuario);
  else res.status(401).send('Credenciales incorrectas');
});

export default router;
