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


}

