import CommonRepository from './common-repository.js';

export default class TestQuestionsRepository {
  constructor() {
    this.commonRepo = new CommonRepository();
  }

  async getAllPreguntasWithCategoriasAndCarreras() {
    await this.commonRepo.connect();
    
    const query = `
      SELECT 
        p.id,
        p.descripcion,
        p.marcada,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', c.id,
              'nombre', c.nombre,
              'logo', c.logo
            )
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'::json
        ) as categorias,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', car.id,
              'nombre', car.nombre,
              'descripcion', car.descripcion,
              'foto', car.foto,
              'duracion', car.duracion
            )
          ) FILTER (WHERE car.id IS NOT NULL), 
          '[]'::json
        ) as carreras
      FROM preguntas p
      LEFT JOIN categorias_x_preguntas cp ON p.id = cp.id_pregunta
      LEFT JOIN categorias c ON cp.id_categoria = c.id
      LEFT JOIN carreras_x_preguntas carp ON p.id = carp.id_pregunta
      LEFT JOIN carreras car ON carp.id_carrera = car.id
      GROUP BY p.id, p.descripcion, p.marcada
      ORDER BY p.id
    `;

    const result = await this.commonRepo.client.query(query);
    return result.rows;
  }

  async saveRespuestas(respuestas) {
    await this.commonRepo.connect();
    
    // Iniciar transacción
    await this.commonRepo.client.query('BEGIN');
    
    try {
      // Eliminar respuestas existentes del usuario
      const deleteQuery = 'DELETE FROM respuestas_test WHERE id_usuario = $1';
      await this.commonRepo.client.query(deleteQuery, [respuestas[0].id_usuario]);
      
      // Insertar nuevas respuestas
      const insertQuery = `
        INSERT INTO respuestas_test (valor, id_usuario, id_pregunta) 
        VALUES ($1, $2, $3)
      `;
      
      for (const respuesta of respuestas) {
        await this.commonRepo.client.query(insertQuery, [
          respuesta.valor,
          respuesta.id_usuario,
          respuesta.id_pregunta
        ]);
      }
      
      await this.commonRepo.client.query('COMMIT');
      return { success: true, message: 'Respuestas guardadas correctamente' };
    } catch (error) {
      await this.commonRepo.client.query('ROLLBACK');
      throw error;
    }
  }

  async getRespuestasByUsuario(idUsuario) {
    await this.commonRepo.connect();
    
    const query = `
      SELECT 
        rt.id,
        rt.valor,
        rt.id_usuario,
        rt.id_pregunta,
        p.descripcion as pregunta_descripcion
      FROM respuestas_test rt
      JOIN preguntas p ON rt.id_pregunta = p.id
      WHERE rt.id_usuario = $1
    `;
    
    const result = await this.commonRepo.client.query(query, [idUsuario]);
    return result.rows;
  }

  async getCarrerasByCategorias(categoriaIds) {
    await this.commonRepo.connect();
    
    if (categoriaIds.length === 0) {
      return [];
    }
    
    const placeholders = categoriaIds.map((_, index) => `$${index + 1}`).join(',');
    
    const query = `
      SELECT DISTINCT
        car.id,
        car.nombre,
        car.descripcion,
        car.foto,
        car.duracion,
        COUNT(cp.id_categoria) as relevancia
      FROM carreras car
      JOIN carreras_x_preguntas carp ON car.id = carp.id_carrera
      JOIN categorias_x_preguntas cp ON carp.id_pregunta = cp.id_pregunta
      WHERE cp.id_categoria IN (${placeholders})
      GROUP BY car.id, car.nombre, car.descripcion, car.foto, car.duracion
      ORDER BY relevancia DESC, car.nombre
    `;
    
    const result = await this.commonRepo.client.query(query, categoriaIds);
    return result.rows;
  }

  async getCategoriasConRespuestas(idUsuario) {
    await this.commonRepo.connect();
    
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.logo,
        COUNT(CASE WHEN rt.valor = true THEN 1 END) as respuestas_positivas,
        COUNT(rt.id) as total_respuestas
      FROM categorias c
      JOIN categorias_x_preguntas cp ON c.id = cp.id_categoria
      JOIN preguntas p ON cp.id_pregunta = p.id
      LEFT JOIN respuestas_test rt ON p.id = rt.id_pregunta AND rt.id_usuario = $1
      GROUP BY c.id, c.nombre, c.logo
      HAVING COUNT(rt.id) > 0
      ORDER BY respuestas_positivas DESC, total_respuestas DESC
    `;
    
    const result = await this.commonRepo.client.query(query, [idUsuario]);
    return result.rows;
  }
}
