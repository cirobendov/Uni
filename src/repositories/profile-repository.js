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
        SELECT *
        FROM perfiles
        ORDER BY id_perfil
      `;
      return await this.safeQuery(sql);
    }

    async getById(idPerfil) {
      await this.connect();
      const sql = `
        SELECT *
        FROM perfiles
        WHERE id_perfil = $1
      `;
      const res = await this.safeQuery(sql, [idPerfil]);
      return res[0] || null;
    }

    // Helper: fetch sections (metadata + pxs) for a profile
    async getSectionsForProfile(idPerfil) {
      await this.connect();
      const sql = `
        SELECT 
          s.id_seccion,
          s.nombre,
          s.tipo_usuario,
          s.componente,
          pxs.orden,
          pxs.visible
        FROM perfilesxsecciones pxs
        JOIN secciones s ON s.id_seccion = pxs.id_seccion
        WHERE pxs.id_perfil = $1
        ORDER BY pxs.orden NULLS LAST, s.id_seccion
      `;
      return await this.safeQuery(sql, [idPerfil]);
    }

    // Whitelist resolver for section data table from componente
    resolveDataTableName(component) {
      if (!component) return null;
      const key = String(component).toLowerCase();

      // Predefined common mappings
      const map = {
        // snake_case
        about: 'about_section_data',
        education: 'education_section_data',
        project: 'projects_section_data',
        projects: 'projects_section_data',
        experiencia: 'experience_section_data',
        experiencia_laboral: 'experience_section_data',
        habilidades: 'skills_section_data',
        skills: 'skills_section_data',
        // PascalCase examples (as per your description)
        about_pascal: 'AboutSectionData',
        education_pascal: 'EducationSectionData',
        projects_pascal: 'ProjectsSectionData',
      };

      if (map[key]) return map[key];
      // try explicit pascal case keys
      if (key === 'about') return map.about_pascal;
      if (key === 'education') return map.education_pascal;
      if (key === 'projects' || key === 'project') return map.projects_pascal;

      // Generic fallback: <component>_section_data (only safe chars)
      const safe = key.replace(/[^a-z0-9_]/g, '');
      if (!safe) return null;
      return `${safe}_section_data`;
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

    async getSectionDataForProfile(tableName, idPerfil) {
      // We cannot parameterize identifiers; ensure whitelist and existence first
      const exists = await this.tableExists(tableName);
      if (!exists) return [];

      // Validate identifier characters strictly
      if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
        return [];
      }

      // Quote if contains uppercase letters
      const needsQuotes = /[A-Z]/.test(tableName);
      const ident = needsQuotes ? `"${tableName}"` : tableName;

      // Safe interpolation since tableName exists and is sanitized
      const sql = `SELECT * FROM ${ident} WHERE id_perfil = $1 ORDER BY 1`;
      return await this.safeQuery(sql, [idPerfil]);
    }

    // Expanded profiles with sections and their data
    async getAllExpanded() {
      await this.connect();
      const perfiles = await this.getAll();

      const enriched = [];
      for (const perfil of perfiles) {
        const idPerfil = perfil.id_perfil || perfil.id || perfil.idperfil; // tolerate naming
        const sections = await this.getSectionsForProfile(idPerfil);

        const detailedSections = [];
        for (const s of sections) {
          const table = this.resolveDataTableName(s.componente);
          const data = await this.getSectionDataForProfile(table, idPerfil);
          detailedSections.push({
            seccion: {
              id_seccion: s.id_seccion,
              nombre: s.nombre,
              tipo_usuario: s.tipo_usuario,
              componente: s.componente,
            },
            config: {
              orden: s.orden,
              visible: s.visible,
            },
            datos: Array.isArray(data) ? data : [],
          });
        }

        enriched.push({
          ...perfil,
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
        const table = this.resolveDataTableName(s.componente);
        const data = await this.getSectionDataForProfile(table, idPerfil);
        detailedSections.push({
          seccion: {
            id_seccion: s.id_seccion,
            nombre: s.nombre,
            tipo_usuario: s.tipo_usuario,
            componente: s.componente,
          },
          config: {
            orden: s.orden,
            visible: s.visible,
          },
          datos: Array.isArray(data) ? data : [],
        });
      }

      return { ...perfil, secciones: detailedSections };
    }
}