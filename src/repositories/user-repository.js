import DBConfig from '../../configs/db-config.js';
import pkg from 'pg';
const { Client } = pkg;

export default class UserRepository {
  async getByEmail(email) {
    const client = new Client(DBConfig);
    await client.connect();
    const res = await client.query('SELECT * FROM users WHERE mail = $3', [email]);
    await client.end();
    return res.rows[0];
  }

  async createUser(user) {
    const client = new Client(DBConfig);
    await client.connect();
    const sql = 'INSERT INTO users (tipo, nombreusuario, mail, contraseña, fecharegistro) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [user.tipo, user.nombreusuario, user.mail, user.contraseña, user.fecharegistro];
    const res = await client.query(sql, values);
    await client.end();
    return res.rows[0];
  }
}
