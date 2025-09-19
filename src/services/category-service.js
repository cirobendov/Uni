import CommonRepository from "../repositories/common-repository.js";
import CategoryRepository from "../repositories/category-repository.js";

export default class CategoryService {
  constructor() {
    this.commonRepo = new CommonRepository();
    this.categoryRepo = new CategoryRepository();
    this.TABLE = "categorias";
  }

  async getAll() {
    const categorias = await this.commonRepo.getAll(this.TABLE);
    return categorias;
  }

  async getCareersByCategory(categoryId) {
    if (!categoryId) throw new Error("categoryId es requerido");
    const carreras = await this.categoryRepo.getCarrerasByCategoria(categoryId);
    return carreras;
  }
}