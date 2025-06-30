import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/user-repository.js';

export default class UserService {
  constructor() {
    this.repo = new UserRepository();
  }

  async login(mail, contraseña) {
    const usuario = await this.repo.getByEmail(email);
    if (!usuario) return null;
    const isValid = await bcrypt.compare(contraseña, user.contraseña);
    return isValid ? usuario : null;
  }

  async register(usuario) {
    const hashed = await bcrypt.hash(usuario.contraseña, 10);
    return this.repo.createUser({ ...usuario, contraseña: hashed });
  }
}
