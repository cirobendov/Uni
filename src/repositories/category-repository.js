import DBConfig from '../config/db-config.js';
import pkg from 'pg';
const { Client } = pkg;

export default class CategoryRepository {
  constructor() {
    this.client = new Client(DBConfig);
  }

  async connect() {
    if (!this.client._connected) {
      await this.client.connect();
      this.client._connected = true;
    }
  }

  async disconnect() {
    if (this.client._connected) {
      await this.client.end();
      this.client._connected = false;
    }
  }

  async safeQuery(sql, params = []) {
    try {
      const res = await this.client.query(sql, params);
      return res.rows;
    } catch (error) {
      console.warn('Query failed, trying fallback:', error.message);
      return [];
    }
  }

  async getCarrerasByCategoria(idCategoria) {
    await this.connect();

    const sql = `
      SELECT 
        carreras.*,
        categorias.nombre AS categoria_nombre
      FROM categorias_x_carrera
      INNER JOIN carreras 
        ON carreras.id = categorias_x_carrera.id_carrera
      INNER JOIN categorias 
        ON categorias.id = categorias_x_carrera.id_categoria
      WHERE categorias.id = $1
      ORDER BY carreras.nombre
    `;

    return await this.safeQuery(sql, [idCategoria]);
  }
}
