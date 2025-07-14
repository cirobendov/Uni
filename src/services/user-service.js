import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/user-repository.js';

export default class UserService {
  constructor() {
    this.repo = new UserRepository();
  }

async login(mail, contraseña) {
  const usuario = await this.repo.getByEmail(mail);
  if (!usuario) return null;
  const isValid = await bcrypt.compare(contraseña, usuario.contraseña);
  return isValid ? usuario : null;
}

async registro(usuario) {
  const hashed = await bcrypt.hash(usuario.contraseña, 10);
  return this.repo.createUser({ ...usuario, contraseña: hashed });
}

  async registrarEstudiante(estudiante) {
    return this.repo.createEstudiante(estudiante);
  }
}

