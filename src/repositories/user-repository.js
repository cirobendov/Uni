import DBConfig from '../config/db-config.js';
import pkg from 'pg';
const { Client } = pkg;

export default class UserRepository {
  async getByEmail(email) {
    const client = new Client(DBConfig);
    await client.connect();
    const res = await client.query('SELECT * FROM users WHERE mail = $1', [email]);
    await client.end();
    return res.rows[0];
  }

  async createUser(usuario) {
    const client = new Client(DBConfig);
    await client.connect();
    const sql = 'INSERT INTO users (tipo, nombreusuario, mail, contraseña, fecharegistro) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [usuario.tipo, usuario.nombreusuario, usuario.mail, usuario.contraseña, usuario.fecharegistro];
    const res = await client.query(sql, values);
    await client.end();
    return res.rows[0];
  }
}

