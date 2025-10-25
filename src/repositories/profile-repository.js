import DBConfig from '../config/db-config.js';
import pkg from "pg";

const { Client } = pkg;

export default class ProfileRepository{
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
        console.warn('ProfileRepository query failed:', error.message);
        return [];
      }
    }

    // Basic profiles
    async getAll() {
      await this.connect();
      const sql = `
        SELECT p.*, u.nombreusuario, u.mail, u.activo, u.emailverificado
        FROM perfiles p
        JOIN usuarios u ON p.idusuario = u.id
        ORDER BY p.id
      `;
      return await this.safeQuery(sql);
    }

    async getById(idPerfil) {
      await this.connect();
      const sql = `
        SELECT p.*, u.nombreusuario, u.mail, u.activo, u.emailverificado
        FROM perfiles p
        JOIN usuarios u ON p.idusuario = u.id
        WHERE p.id = $1
      `;
      const res = await this.safeQuery(sql, [idPerfil]);
      return res[0] || null;
    }

    async getByUserId(idUsuario) {
      await this.connect();
      const sql = `
        SELECT p.*, u.nombreusuario, u.mail, u.activo, u.emailverificado
        FROM perfiles p
        JOIN usuarios u ON p.idusuario = u.id
        WHERE p.idusuario = $1
      `;
      const res = await this.safeQuery(sql, [idUsuario]);
      return res[0] || null;
    }

    // Helper: fetch sections (metadata + pxs) for a profile
    async getSectionsForProfile(idPerfil) {
      await this.connect();
      const sql = `
        SELECT 
          pxs.id as id_perfil_x_seccion,
          s.id as id_seccion,
          s.nombre,
          s.tipo_usuario,
          s.descripcion,
          pxs.orden,
          pxs.visible
        FROM perfil_x_seccion pxs
        JOIN secciones_disponibles s ON s.id = pxs.idseccion
        WHERE pxs.idperfil = $1
        ORDER BY pxs.orden NULLS LAST, s.id
      `;
      return await this.safeQuery(sql, [idPerfil]);
    }

    // Whitelist resolver for section data table from section name
    resolveDataTableName(sectionName) {
      if (!sectionName) return null;
      const key = String(sectionName).toLowerCase();

      // Map visible section names to their corresponding table names
      const sectionTables = {
        about: 'seccion_about',
        education: 'seccion_education',
        educacion: 'seccion_education',
        experience: 'seccion_experience',
        experiencia: 'seccion_experience',
        projects: 'seccion_projects',
        proyectos: 'seccion_projects',
        activity: 'seccion_activity',
        actividad: 'seccion_activity'
      };

      return sectionTables[key] || null;
    }

    async getSeccionesDisponibles() {
      await this.connect();
      const sql = `
        SELECT * FROM secciones_disponibles
      `;
      return await this.safeQuery(sql);
    }


    async tableExists(tableName) {
      if (!tableName) return false;
      const sql = `
        SELECT 1
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `;
      const res = await this.safeQuery(sql, [tableName]);
      return res.length > 0;
    }

    async getSectionDataBySectionId(tableName, idPerfilXSeccion) {
      if (!tableName) return [];

      // We cannot parameterize identifiers; ensure whitelist and existence first
      const exists = await this.tableExists(tableName);
      if (!exists) return [];

      // Validate identifier characters strictly
      if (!/^[a-z0-9_]+$/.test(tableName)) {
        return [];
      }

      try {
        const sql = `
          SELECT *
          FROM ${tableName}
          WHERE id_perfil_x_seccion = $1
          ORDER BY id
        `;
        return await this.safeQuery(sql, [idPerfilXSeccion]);
      } catch (error) {
        console.error('Error fetching section data:', error);
        return [];
      }
    }

    // Expanded profiles with sections and their data
    async getAllExpanded() {
      await this.connect();
      const perfiles = await this.getAll();

      const enriched = [];
      for (const perfil of perfiles) {
        const idPerfil = perfil.id;
        const sections = await this.getSectionsForProfile(idPerfil);

        const detailedSections = [];
        for (const s of sections) {
          const table = this.resolveDataTableName(s.nombre);
          const data = table ? await this.getSectionDataBySectionId(table, s.id_perfil_x_seccion) : [];
          
          detailedSections.push({
            seccion: {
              id: s.id_seccion,
              nombre: s.nombre,
              tipo_usuario: s.tipo_usuario,
              descripcion: s.descripcion,
            },
            config: {
              orden: s.orden,
              visible: s.visible,
            },
            datos: Array.isArray(data) ? data : [],
          });
        }

        // Remove sensitive data from the response
        const { idusuario, ...perfilData } = perfil;
        
        enriched.push({
          ...perfilData,
          secciones: detailedSections,
        });
      }

      return enriched;
    }

    async getByIdExpanded(idPerfil) {
      await this.connect();
      const perfil = await this.getById(idPerfil);
      if (!perfil) return null;

      const sections = await this.getSectionsForProfile(idPerfil);
      const detailedSections = [];
      
      for (const s of sections) {
        const table = this.resolveDataTableName(s.nombre);
        const data = table ? await this.getSectionDataBySectionId(table, s.id_perfil_x_seccion) : [];
        
        detailedSections.push({
          seccion: {
            id: s.id_seccion,
            nombre: s.nombre,
            tipo_usuario: s.tipo_usuario,
            descripcion: s.descripcion,
          },
          config: {
            orden: s.orden,
            visible: s.visible,
          },
          datos: Array.isArray(data) ? data : [],
        });
      }

      // Remove sensitive data from the response
      const { idusuario, ...perfilData } = perfil;
      
      return { 
        ...perfilData, 
        secciones: detailedSections 
      };
    }

    async getByUserIdExpanded(idUsuario) {
      await this.connect();
      const perfil = await this.getByUserId(idUsuario);
      if (!perfil) return null;

      const sections = await this.getSectionsForProfile(perfil.id);
      const detailedSections = [];
      
      for (const s of sections) {
        const table = this.resolveDataTableName(s.nombre);
        const data = table ? await this.getSectionDataBySectionId(table, s.id_perfil_x_seccion) : [];
        
        detailedSections.push({
          seccion: {
            id: s.id_seccion,
            nombre: s.nombre,
            tipo_usuario: s.tipo_usuario,
            descripcion: s.descripcion,
          },
          config: {
            orden: s.orden,
            visible: s.visible,
          },
          datos: Array.isArray(data) ? data : [],
        });
      }

      // Remove sensitive data from the response
      const { idusuario, ...perfilData } = perfil;
      
      return { 
        ...perfilData, 
        secciones: detailedSections 
      };
    }

    async createProfile(data, idusuario) {
      await this.connect();
      const sql = `
        INSERT INTO perfiles (${Object.keys(data).join(', ')}), idusuario)
        VALUES (${Object.values(data).join(', ')}), $1)
        RETURNING *
      `;
      const res = await this.safeQuery(sql, [...Object.values(data), idusuario]);
      return res[0] || null;
    }

    async getProfileId(idusuario) {
      await this.connect();
      const sql = `
        SELECT id
        FROM perfiles
        WHERE idusuario = $1
      `;
      const res = await this.safeQuery(sql, [idusuario]);
      return res[0] || null;
    }



    async addSection(data, idPerfil) {
      await this.connect();

      const visible = data.visible ?? true;
      const orden = data.orden ?? null;
      const idseccion = data.idseccion;
      if (!idPerfil || !idseccion) {
        return [];
      }

      const insertPxsSql = `
        INSERT INTO perfil_x_seccion (idperfil, idseccion, visible, orden)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const pxsRows = await this.safeQuery(insertPxsSql, [idPerfil, idseccion, visible, orden]);
      if (!pxsRows.length) return [];
      const idPerfilXSeccion = pxsRows[0].id;

      // Resolve target data table directly (avoid method binding issues)
      const secRows = await this.safeQuery(
        `SELECT nombre FROM secciones_disponibles WHERE id = $1`,
        [idseccion]
      );
      const secName = secRows.length ? secRows[0].nombre : null;
      const tableName = this.resolveDataTableName(secName);
      if (!tableName) {
        return [{ id_perfil_x_seccion: idPerfilXSeccion }];
      }

      const exists = await this.tableExists(tableName);
      if (!exists) {
        return [{ id_perfil_x_seccion: idPerfilXSeccion }];
      }

      const sectionPayload = data[tableName] && typeof data[tableName] === 'object' ? data[tableName] : null;
      if (!sectionPayload) {
        return [{ id_perfil_x_seccion: idPerfilXSeccion }];
      }

      const cleanEntries = Object.entries(sectionPayload)
        .filter(([k]) => k !== 'id' && k !== 'id_perfil_x_seccion');
      const cols = ['id_perfil_x_seccion', ...cleanEntries.map(([k]) => k)];
      const vals = [idPerfilXSeccion, ...cleanEntries.map(([, v]) => v)];
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');

      const insertDataSql = `
        INSERT INTO ${tableName} (${cols.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      const dataRows = await this.safeQuery(insertDataSql, vals);
      return dataRows;
    }

    async updateSection(idPerfilXSeccion, idPerfil, data) {
      await this.connect();

      // Ensure the pxs exists and belongs to the provided profile (if provided)
      const pxsRows = await this.safeQuery(
        `SELECT id, idperfil, idseccion, visible, orden FROM perfil_x_seccion WHERE id = $1`,
        [idPerfilXSeccion]
      );
      if (!pxsRows.length) return null;
      const pxs = pxsRows[0];
      if (idPerfil && Number(idPerfil) !== Number(pxs.idperfil)) {
        return null;
      }

      let updatedConfig = null;
      const setParts = [];
      const setVals = [];
      let idx = 1;
      if (Object.prototype.hasOwnProperty.call(data, 'visible')) {
        setParts.push(`visible = $${idx++}`);
        setVals.push(data.visible);
      }
      if (Object.prototype.hasOwnProperty.call(data, 'orden')) {
        setParts.push(`orden = $${idx++}`);
        setVals.push(data.orden);
      }
      if (setParts.length) {
        const updateSql = `
          UPDATE perfil_x_seccion
          SET ${setParts.join(', ')}
          WHERE id = $${idx}
          RETURNING id, idperfil, idseccion, visible, orden
        `;
        const rows = await this.safeQuery(updateSql, [...setVals, idPerfilXSeccion]);
        updatedConfig = rows[0] || null;
      }

      // Resolve data table for the pxs
      const secRows = await this.safeQuery(
        `SELECT nombre FROM secciones_disponibles WHERE id = $1`,
        [pxs.idseccion]
      );
      const secName = secRows.length ? secRows[0].nombre : null;
      const tableName = this.resolveDataTableName(secName);

      let updatedData = [];
      if (tableName && /^[a-z0-9_]+$/.test(tableName) && await this.tableExists(tableName)) {
        const sectionPayload = data[tableName] && typeof data[tableName] === 'object' ? data[tableName] : null;
        if (sectionPayload) {
          const cleanEntries = Object.entries(sectionPayload)
            .filter(([k]) => k !== 'id' && k !== 'id_perfil_x_seccion');
          if (cleanEntries.length) {
            const setCols = cleanEntries.map(([k], i) => `${k} = $${i + 2}`).join(', ');
            const values = [idPerfilXSeccion, ...cleanEntries.map(([, v]) => v)];
            const updateDataSql = `
              UPDATE ${tableName}
              SET ${setCols}
              WHERE id_perfil_x_seccion = $1
              RETURNING *
            `;
            updatedData = await this.safeQuery(updateDataSql, values);
          }
        }
      }

      if (updatedData && updatedData.length) return updatedData;
      if (updatedConfig) return [{ id_perfil_x_seccion: pxs.id, ...updatedConfig }];
      return [{ id_perfil_x_seccion: pxs.id }];
    }

    async deleteSection(idPerfilXSeccion, idPerfil) {
      await this.connect();

      // Ensure the pxs exists and belongs to the provided profile (if provided)
      const pxsRows = await this.safeQuery(
        `SELECT id, idperfil, idseccion FROM perfil_x_seccion WHERE id = $1`,
        [idPerfilXSeccion]
      );
      if (!pxsRows.length) return null;
      const pxs = pxsRows[0];
      if (idPerfil && Number(idPerfil) !== Number(pxs.idperfil)) {
        return null;
      }

      // Resolve data table and delete data rows first
      const secRows = await this.safeQuery(
        `SELECT nombre FROM secciones_disponibles WHERE id = $1`,
        [pxs.idseccion]
      );
      const secName = secRows.length ? secRows[0].nombre : null;
      const tableName = this.resolveDataTableName(secName);

      let deletedDataCount = 0;
      if (tableName && /^[a-z0-9_]+$/.test(tableName) && await this.tableExists(tableName)) {
        const deletedDataRows = await this.safeQuery(
          `DELETE FROM ${tableName} WHERE id_perfil_x_seccion = $1 RETURNING id`,
          [idPerfilXSeccion]
        );
        deletedDataCount = deletedDataRows.length;
      }

      const deletedPxsRows = await this.safeQuery(
        `DELETE FROM perfil_x_seccion WHERE id = $1 RETURNING id`,
        [idPerfilXSeccion]
      );
      if (!deletedPxsRows.length) return null;

      return {
        id_perfil_x_seccion: idPerfilXSeccion,
        deleted_data_count: deletedDataCount,
        deleted: true
      };
    }

}