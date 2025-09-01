import CommonRepository from "../repositories/common-repository.js";

export default class CategoryService {
  constructor() {
    this.commonRepo = new CommonRepository();
    this.TABLE = "categorias";
  }

  async getAll() {
    const categorias = await this.commonRepo.getAll(this.TABLE);
    return categorias;
  }
}