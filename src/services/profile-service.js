import CommonRepository from "../repositories/common-repository.js";
import ProfileRepository from "../repositories/profile-repository.js";

export default class ProfileService {
    constructor() {
        this.commonRepo = new CommonRepository();
        this.profileRepo = new ProfileRepository();
        this.TABLE = "perfiles";
    }

    async getAll() {
        const profiles = await this.commonRepo.getAll(this.TABLE);
        return profiles;
    }

    async getAllExpanded() {
        const profiles = await this.profileRepo.getAllExpanded();
        return profiles;
    }

    async getById(id) {
        if (!id || Number.isNaN(Number(id))) {
            const err = new Error('Parámetro id inválido');
            err.status = 400;
            throw err;
        }

        const profile = await this.commonRepo.getById(this.TABLE, id);
        return profile;
    }

    async getByIdExpanded(id) {
        if (!id || Number.isNaN(Number(id))) {
            const err = new Error('Parámetro id inválido');
            err.status = 400;
            throw err;
        }

        const profile = await this.profileRepo.getByIdExpanded(id);
        return profile;
    }
}