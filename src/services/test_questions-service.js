import CommonRepository from "../repositories/common-repository.js";
import TestQuestionsRepository from "../repositories/test_questions-repository.js";

export default class TestQuestionsService {
  constructor() {
    this.commonRepo = new CommonRepository();
    this.testQuestionsRepo = new TestQuestionsRepository();
    this.TABLE = "preguntas";
  }

  async getAll() {
    const testQuestions = await this.commonRepo.getAll(this.TABLE);
    return testQuestions;
  }

  async getById(id) {
    if (!id || Number.isNaN(Number(id))) {
      const err = new Error('Parámetro id inválido');
      err.status = 400;
      throw err;
    }
    const testQuestion = await this.commonRepo.getById(this.TABLE, id);
    if (!testQuestion) {
      return null;
    }
    return testQuestion;
  }

  async getAllPreguntasWithCategoriasAndCarreras() {
    try {
      const preguntas = await this.testQuestionsRepo.getAllPreguntasWithCategoriasAndCarreras();
      return preguntas;
    } catch (error) {
      const err = new Error(`Error al obtener preguntas: ${error.message}`);
      err.status = 500;
      throw err;
    }
  }

  async saveRespuestas(respuestas) {
    // Validaciones
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      const err = new Error('Las respuestas deben ser un array no vacío');
      err.status = 400;
      throw err;
    }

    // Validar estructura de cada respuesta
    for (const respuesta of respuestas) {
      if (!respuesta.hasOwnProperty('valor') || typeof respuesta.valor !== 'boolean') {
        const err = new Error('Cada respuesta debe tener un campo "valor" de tipo boolean');
        err.status = 400;
        throw err;
      }
      if (!respuesta.id_usuario || Number.isNaN(Number(respuesta.id_usuario))) {
        const err = new Error('Cada respuesta debe tener un id_usuario válido');
        err.status = 400;
        throw err;
      }
      if (!respuesta.id_pregunta || Number.isNaN(Number(respuesta.id_pregunta))) {
        const err = new Error('Cada respuesta debe tener un id_pregunta válido');
        err.status = 400;
        throw err;
      }
    }

    try {
      const result = await this.testQuestionsRepo.saveRespuestas(respuestas);
      return result;
    } catch (error) {
      const err = new Error(`Error al guardar respuestas: ${error.message}`);
      err.status = 500;
      throw err;
    }
  }

  async calcularResultados(idUsuario) {
    if (!idUsuario || Number.isNaN(Number(idUsuario))) {
      const err = new Error('ID de usuario inválido');
      err.status = 400;
      throw err;
    }

    try {
      // Obtener categorías con respuestas del usuario
      const categoriasConRespuestas = await this.testQuestionsRepo.getCategoriasConRespuestas(idUsuario);
      
      if (categoriasConRespuestas.length === 0) {
        return {
          mensaje: 'No se encontraron respuestas para este usuario',
          carreras_recomendadas: []
        };
      }

      // Encontrar la(s) categoría(s) con más respuestas positivas
      const maxRespuestas = Math.max(...categoriasConRespuestas.map(c => c.respuestas_positivas));
      const categoriasTop = categoriasConRespuestas.filter(c => c.respuestas_positivas === maxRespuestas);
      
      // Obtener carreras asociadas a las categorías top
      const categoriaIds = categoriasTop.map(c => c.id);
      const carrerasRecomendadas = await this.testQuestionsRepo.getCarrerasByCategorias(categoriaIds);

      return {
        usuario_id: idUsuario,
        categorias_analizadas: categoriasConRespuestas,
        categorias_top: categoriasTop,
        carreras_recomendadas: carrerasRecomendadas,
        total_carreras: carrerasRecomendadas.length
      };

    } catch (error) {
      const err = new Error(`Error al calcular resultados: ${error.message}`);
      err.status = 500;
      throw err;
    }
  }

}
