import DBConfig from '../config/db-config.js';
import pkg from 'pg';
const { Client } = pkg;

export default class CareerRepository {
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

    async getCarrerasByCategoria(idCategoria) {
      await this.connect();
      
      const sql = `
        SELECT 
          carreras.*,
          categorias.nombre as categoria_nombre
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

    async createCarreraForUsuario(carreraData, idUsuario) {
      await this.connect();
      
      // Start a transaction
      await this.client.query('BEGIN');
      
      try {
        // 1. Get the university ID for this user
        const universidadResult = await this.client.query(
          'SELECT id FROM universidades WHERE idusuario = $1',
          [idUsuario]
        );
        
        if (universidadResult.rows.length === 0) {
          throw new Error('No se encontró la universidad para este usuario');
        }
        
        const idUniversidad = universidadResult.rows[0].id;
        
        // 2. Insert the new career
        const insertCarreraSql = `
          INSERT INTO carreras (nombre, descripcion, foto)
          VALUES ($1, $2, $3)
          RETURNING id`;
          
        const carreraResult = await this.client.query(insertCarreraSql, [
          carreraData.nombre,
          carreraData.descripcion,
          carreraData.foto
        ]);
        
        const idCarrera = carreraResult.rows[0].id;
        
        // 3. Link the career to the university with both iduniversidad and idusuario
        const insertLinkSql = `
          INSERT INTO carrerasxuniversidades (
            iduniversidad,
            idusuario,
            idcarrera,
            duracion,
            costo,
            modalidad,
            titulo_otorgado,
            sede,
            perfil_graduado,
            plan_estudios
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`;
          
        const linkResult = await this.client.query(insertLinkSql, [
          idUniversidad,
          idUsuario,
          idCarrera,
          carreraData.duracion,
          carreraData.costo,
          carreraData.modalidad,
          carreraData.titulo_otorgado,
          carreraData.sede,
          carreraData.perfil_graduado,
          carreraData.plan_estudios
        ]);
        
        // 4. Get the complete career data to return
        const carreraCompleta = await this.client.query(`
          SELECT c.*, cxu.*, u.nombre as nombre_universidad
          FROM carreras c
          JOIN carrerasxuniversidades cxu ON c.id = cxu.idcarrera
          JOIN universidades u ON u.id = cxu.iduniversidad
          WHERE c.id = $1 AND cxu.idusuario = $2
        `, [idCarrera, idUsuario]);
        
        await this.client.query('COMMIT');
        return carreraCompleta.rows[0] || linkResult.rows[0];
        
      } catch (error) {
        await this.client.query('ROLLBACK');
        throw error;
      }
    }

    async asociarCarreraAUniversidad(idCarrera, idUsuario, carreraData) {
      await this.connect();
      
      // Start a transaction
      await this.client.query('BEGIN');
      
      try {
        // 1. Get the university ID for this user
        const universidadResult = await this.client.query(
          'SELECT id FROM universidades WHERE idusuario = $1',
          [idUsuario]
        );
        
        if (universidadResult.rows.length === 0) {
          throw new Error('No se encontró la universidad para este usuario');
        }
        
        const idUniversidad = universidadResult.rows[0].id;
        
        // 2. Check if the career exists
        const carreraResult = await this.client.query(
          'SELECT id FROM carreras WHERE id = $1',
          [idCarrera]
        );
        
        if (carreraResult.rows.length === 0) {
          throw new Error('La carrera especificada no existe');
        }
        
        // 3. Check if the career is already associated with this user's university
        const existingLink = await this.client.query(
          `SELECT * FROM carrerasxuniversidades 
           WHERE idcarrera = $1 AND idusuario = $2`,
          [idCarrera, idUsuario]
        );
        
        if (existingLink.rows.length > 0) {
          throw new Error('Esta carrera ya está asociada a la universidad');
        }
        
        // 4. Create the association including idusuario
        const insertLinkSql = `
          INSERT INTO carrerasxuniversidades (
            iduniversidad,
            idusuario,
            idcarrera,
            duracion,
            costo,
            modalidad,
            titulo_otorgado,
            sede,
            perfil_graduado,
            plan_estudios
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`;
          
        const linkResult = await this.client.query(insertLinkSql, [
          idUniversidad,
          idUsuario,
          idCarrera,
          carreraData.duracion,
          carreraData.costo,
          carreraData.modalidad,
          carreraData.titulo_otorgado,
          carreraData.sede,
          carreraData.perfil_graduado,
          carreraData.plan_estudios
        ]);
        
        // 5. Get the complete career data to return
        const carreraCompleta = await this.client.query(`
          SELECT c.*, cxu.*, u.nombre as nombre_universidad
          FROM carreras c
          JOIN carrerasxuniversidades cxu ON c.id = cxu.idcarrera
          JOIN universidades u ON u.id = cxu.iduniversidad
          WHERE c.id = $1 AND cxu.idusuario = $2
        `, [idCarrera, idUsuario]);
        
        await this.client.query('COMMIT');
        return carreraCompleta.rows[0] || linkResult.rows[0];
        
      } catch (error) {
        await this.client.query('ROLLBACK');
        throw error;
      }
    }
}