import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import UserRepository from '../repositories/user-repository.js';
import CommonRepository from '../repositories/common-repository.js';

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export default class UserService {
  constructor() {
    this.repo = new UserRepository();
    this.commonRepo = new CommonRepository();
  }

  async login({ mail, contraseña }) {
    const usuario = await this.commonRepo.getOneByField('usuarios', 'mail', mail);
    if (!usuario) {
      return {
        status: 401,
        body: { success: false, message: 'Mail o contraseña incorrectos.' }
      };
    }
    const isValid = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!isValid) {
      return {
        status: 401,
        body: { success: false, message: 'Mail o contraseña incorrectos.' }
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
    const [existente, existenteNombreUsuario] = await Promise.all([
      this.commonRepo.getOneByField('usuarios', 'mail', usuario.mail),
      this.commonRepo.getOneByField('usuarios', 'nombreusuario', usuario.nombreusuario)
    ]);
    if (existente) {
      throw new Error('Ya existe un usuario con ese mail.');
    } else if (existenteNombreUsuario) {
      throw new Error('Ya existe un usuario con ese nombre de usuario.');
    }
    const hashed = await bcrypt.hash(usuario.contraseña, 10);
    return this.repo.createUser({ ...usuario, contraseña: hashed });
  }
  
  async validateExistence(mail, nombreusuario) {
    const existente = await this.commonRepo.getOneByField('usuarios', 'mail', mail);
    if (existente) {
        const err = new Error('El mail ya está registrado.');
        err.status = 400;
        throw err;
    }

    const existenteNombreUsuario = await this.commonRepo.getOneByField('usuarios', 'nombreusuario', nombreusuario);
    if (existenteNombreUsuario) {
        const err = new Error('El nombre de usuario ya está registrado.');
        err.status = 400;
        throw err;
    }

    return { success: true, message: 'Mail y nombre de usuario disponibles.' };
  }


  async registrarEstudiante(estudiante) {
    return this.repo.createEstudiante(estudiante);
  }

  async rehashExistingPlaintextPasswords() {
    const usuarios = await this.commonRepo.getAll('usuarios');
    let updated = 0;
    const changed = [];
    for (const u of usuarios) {
      const pass = u.contraseña || '';
      const looksHashed = typeof pass === 'string' && pass.length >= 59 && /^\$2[aby]\$/.test(pass);
      if (!looksHashed && pass) {
        const hashed = await bcrypt.hash(pass, 10);
        await this.repo.updatePasswordById(u.id, hashed);
        updated += 1;
        changed.push(u.id);
      }
    }
    return { updated, changed };
  }

  async registerUniversityUser(data) {
    const usuario = {
      tipo: 'Universidad',
      nombreusuario: data.nombreusuario,
      mail: data.mail,
      contraseña: data.contraseña
    };
    const [existente, existenteNombreUsuario] = await Promise.all([
      this.commonRepo.getOneByField('usuarios', 'mail', usuario.mail),
      this.commonRepo.getOneByField('usuarios', 'nombreusuario', usuario.nombreusuario)
    ]);
    if (existente) {
      const err = new Error('Ya existe un usuario con ese mail.');
      err.status = 400;
      throw err;
    }
    if (existenteNombreUsuario) {
      const err = new Error('Ya existe un usuario con ese nombre de usuario.');
      err.status = 400;
      throw err;
    }
    const hashed = await bcrypt.hash(usuario.contraseña, 10);
    const created = await this.repo.createUser({ ...usuario, contraseña: hashed });
    return created;
  }
}

