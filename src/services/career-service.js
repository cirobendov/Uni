import CommonRepository from "../repositories/common-repository.js";
import CareerRepository from "../repositories/career-repository.js";

export default class CareerService {
  constructor() {
    this.careerRepo = new CareerRepository();
    this.commonRepo = new CommonRepository();
    this.TABLE = "carreras";
  }

  async getAll() {
    const carreras = await this.commonRepo.getAll(this.TABLE);
    return carreras;
  }

  async getById(id) {
    if (!id || Number.isNaN(Number(id))) {
      const err = new Error('Parámetro id inválido');
      err.status = 400;
      throw err;
    }
    const carrera = await this.commonRepo.getById(this.TABLE, id);
    if (!carrera) {
      return null;
    }
    return carrera;
  }

  async getCarrerasByCategoria(idCategoria) {
    const carreras = await this.careerRepo.getCarrerasByCategoria(idCategoria);
    return carreras;
  }

  async asociarCarreraAUniversidad(idCarrera, idUsuario, carreraData) {
    // Validate required fields for the university-specific data
    const requiredFields = [
      'duracion', 'costo', 'modalidad', 
      'titulo_otorgado', 'sede'
    ];
    
    const missingFields = requiredFields.filter(field => carreraData[field] === undefined || carreraData[field] === '');
    if (missingFields.length > 0) {
      const error = new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
      error.status = 400;
      throw error;
    }

    // Validate IDs
    if (!idCarrera || Number.isNaN(Number(idCarrera))) {
      const error = new Error('ID de carrera inválido');
      error.status = 400;
      throw error;
    }

    if (!idUsuario || Number.isNaN(Number(idUsuario))) {
      const error = new Error('ID de usuario inválido');
      error.status = 400;
      throw error;
    }

    // Set default values for optional fields
    const carreraWithDefaults = {
      ...carreraData,
      perfil_graduado: carreraData.perfil_graduado || null,
      plan_estudios: carreraData.plan_estudios || null,
      id_director_carrera: carreraData.id_director_carrera || null
    };

    // Associate the career with the university
    const result = await this.careerRepo.asociarCarreraAUniversidad(
      idCarrera,
      idUsuario,
      carreraWithDefaults
    );

    return result;
  }
}

