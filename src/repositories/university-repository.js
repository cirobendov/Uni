import DBConfig from '../config/db-config.js';
import pkg from 'pg';
const { Client } = pkg;

export default class UniversityRepository {
    constructor() {
      this.client = new Client(DBConfig);
    }
  
    async connect() {
      if (!this.client._connected) {
        await this.client.connect();
        this.client._connected = true; // Marcar como conectado
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

    async getAll() {
      await this.connect();
      
      const sql = `
        SELECT *
        FROM universidades 
        ORDER BY nombre
      `;
      
      return await this.safeQuery(sql);
    }
 
    async getAllExpanded() {
      await this.connect();
      
      const sql = `
        SELECT
          u.*,
          COALESCE(
            json_agg(
              json_build_object(
                'carrera', to_jsonb(c.*),
                'detalles', to_jsonb(cxu.*)
              )
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'::json
          ) AS carreras
        FROM universidades u
        LEFT JOIN carrerasxuniversidades cxu ON cxu.iduniversidad = u.id
        LEFT JOIN carreras c ON c.id = cxu.idcarrera
        GROUP BY u.id
        ORDER BY u.id
      `;
      
      return await this.safeQuery(sql);
    }

    async getByIdExpanded(id) {
      await this.connect();
      
      const sql = `
        SELECT
          u.*,
          COALESCE(
            json_agg(
              json_build_object(
                'carrera', to_jsonb(c.*),
                'detalles', to_jsonb(cxu.*)
              )
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'::json
          ) AS carreras
        FROM universidades u
        LEFT JOIN carrerasxuniversidades cxu ON cxu.iduniversidad = u.id
        LEFT JOIN carreras c ON c.id = cxu.idcarrera
        WHERE u.id = $1
        GROUP BY u.id
        ORDER BY u.id
      `;
      
      const result = await this.safeQuery(sql, [id]);
      return result[0] || null;
    }

    async getCarrerasByUniversidad(idUniversidad) {
      await this.connect();
      
      const sql = `
        SELECT c.*, cxu.*
        FROM carrerasxuniversidades cxu
        JOIN carreras c ON c.id = cxu.idcarrera
        WHERE cxu.iduniversidad = $1
        ORDER BY c.id
      `;
      
      return await this.safeQuery(sql, [idUniversidad]);
    }

    async getCarrerasWithCategorias(idUniversidad) {
      await this.connect();
      
      const sql = `
        SELECT 
          c.*, 
          cxu.*,
          to_jsonb(cat.*) as categoria
        FROM carrerasxuniversidades cxu
        JOIN carreras c ON c.id = cxu.idcarrera
        LEFT JOIN categorias cat ON c.id_categoria = cat.id
        WHERE cxu.iduniversidad = $1
        ORDER BY c.id
      `;
      
      return await this.safeQuery(sql, [idUniversidad]);
    }
}