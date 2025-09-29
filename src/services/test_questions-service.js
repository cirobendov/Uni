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
      
      // Obtener carreras con respuestas del usuario
      const carrerasConRespuestas = await this.testQuestionsRepo.getCarrerasConRespuestas(idUsuario);
      
      if (categoriasConRespuestas.length === 0 && carrerasConRespuestas.length === 0) {
        return {
          mensaje: 'No se encontraron respuestas para este usuario',
          carreras_recomendadas: []
        };
      }

      // Encontrar la(s) categoría(s) con más respuestas positivas
      let categoriasTop = [];
      if (categoriasConRespuestas.length > 0) {
        const maxRespuestas = Math.max(...categoriasConRespuestas.map(c => c.respuestas_positivas));
        categoriasTop = categoriasConRespuestas.filter(c => c.respuestas_positivas === maxRespuestas);
      }

      // Encontrar la(s) carrera(s) con más respuestas positivas
      let carrerasTop = [];
      if (carrerasConRespuestas.length > 0) {
        const maxRespuestasCarreras = Math.max(...carrerasConRespuestas.map(c => c.respuestas_positivas));
        carrerasTop = carrerasConRespuestas.filter(c => c.respuestas_positivas === maxRespuestasCarreras);
      }
      
      // Obtener carreras asociadas a las categorías top (como respaldo)
      let carrerasPorCategoria = [];
      if (categoriasTop.length > 0) {
        const categoriaIds = categoriasTop.map(c => c.id);
        carrerasPorCategoria = await this.testQuestionsRepo.getCarrerasByCategorias(categoriaIds);
      }

      // Combinar y priorizar carreras específicas sobre carreras por categoría
      const carrerasRecomendadas = [...carrerasConRespuestas];
      
      // Agregar carreras por categoría que no estén ya en la lista
      for (const carrera of carrerasPorCategoria) {
        if (!carrerasRecomendadas.some(c => c.id === carrera.id)) {
          carrerasRecomendadas.push(carrera);
        }
      }

      // Ordenar por relevancia (respuestas positivas primero, luego por nombre)
      carrerasRecomendadas.sort((a, b) => {
        const respuestasA = a.respuestas_positivas || 0;
        const respuestasB = b.respuestas_positivas || 0;
        if (respuestasA !== respuestasB) {
          return respuestasB - respuestasA; // Más respuestas primero
        }
        return a.nombre.localeCompare(b.nombre); // Alfabético si empatan
      });

      return {
        usuario_id: idUsuario,
        categorias_analizadas: categoriasConRespuestas,
        categorias_top: categoriasTop,
        carreras_analizadas: carrerasConRespuestas,
        carreras_top: carrerasTop,
        carreras_recomendadas: carrerasRecomendadas,
        total_carreras: carrerasRecomendadas.length,
        explicacion: {
          logica: "Las carreras se ordenan primero por respuestas específicas, luego por relevancia de categorías",
          carrera_mas_seleccionada: carrerasTop.length > 0 ? carrerasTop[0].nombre : "N/A"
        }
      };

    } catch (error) {
      const err = new Error(`Error al calcular resultados: ${error.message}`);
      err.status = 500;
      throw err;
    }
  }

}
