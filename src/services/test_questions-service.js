import CommonRepository from "../repositories/common-repository.js";

export default class TestQuestionsService {
  constructor() {
    this.commonRepo = new CommonRepository();
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

}
