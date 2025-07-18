import { Router } from 'express';
import UserService from '../services/user-service.js';
import jwt from 'jsonwebtoken';

const router = Router();
const svc = new UserService();

router.post('/registro', async (req, res) => {
  const usuario = await svc.registro(req.body);
  res.status(201).json(usuario);
});

router.post('/login', async (req, res) => {
  const { mail, contraseña } = req.body;
  const usuario = await svc.login(mail, contraseña);
  if (usuario) {
    const payload = { id: usuario.id, mail: usuario.mail };
    const secretKey = 'ClaveSecreta2000$';
    const options = { expiresIn: '1h', issuer: 'mi_organizacion' };
    const token = jwt.sign(payload, secretKey, options);
    res.status(200).json({ usuario, token });
  } else res.status(401).send('Credenciales incorrectas');
});

router.post('/estudiantes', async (req, res) => {
  await svc.registrarEstudiante(req.body);
  res.status(201).json({ message: 'Estudiante registrado', estudiante: req.body });
});

export default router;
