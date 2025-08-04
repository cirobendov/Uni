import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/user-repository.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export default class UserService {
  constructor() {
    this.repo = new UserRepository();
  }

  async login({ mail, contraseña }) {
    const usuario = await this.repo.getByEmail(mail);
    if (!usuario) {
      return {
        status: 401,
        body: { success: false, error: 'Mail o contraseña incorrectos.' }
      };
    }
    const isValid = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!isValid) {
      return {
        status: 401,
        body: { success: false, error: 'Mail o contraseña incorrectos.' }
      };
    }

    const token = jwt.sign({id: usuario.id, nombreusuario: usuario.nombreusuario, tipo: usuario.tipo},
      JWT_SECRET, { expiresIn: '1d', issuer: 'mi_organizacion' }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: 'Inicio de sesión exitoso.',
        token,
        usuario: {
          id: usuario.id,
          nombreusuario: usuario.nombreusuario,
          tipo: usuario.tipo
        }
      }
    };
  }

  async registro(usuario) {
    const existente = await this.repo.getByEmail(usuario.mail);
    if (existente) {
      throw new Error('Ya existe un usuario con ese mail.');
    }
    const hashed = await bcrypt.hash(usuario.contraseña, 10);
    return this.repo.createUser({ ...usuario, contraseña: hashed });
  }

  async registrarEstudiante(estudiante) {
    return this.repo.createEstudiante(estudiante);
  }
}

