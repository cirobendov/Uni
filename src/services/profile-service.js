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

    async getByUserIdExpanded(userId) {
        if (!userId || Number.isNaN(Number(userId))) {
            const err = new Error('Parámetro userId inválido');
            err.status = 400;
            throw err;
        }
        const profile = await this.profileRepo.getByUserIdExpanded(userId);
        return profile;
    }

    async getProfileId(idusuario) {
        const profile = await this.profileRepo.getProfileId(idusuario);
        return profile;
    }

    async addSection(data, idPerfil) {
        const profile = await this.profileRepo.addSection(data, idPerfil);
        return profile;
    }

    async updateSection(idPerfilXSeccion, data, idPerfil) {
        if (!idPerfilXSeccion || Number.isNaN(Number(idPerfilXSeccion))) {
            const err = new Error('Parámetro id de sección inválido');
            err.status = 400;
            throw err;
        }
        const updated = await this.profileRepo.updateSection(idPerfilXSeccion, idPerfil, data);
        return updated;
    }

    async deleteSection(idPerfilXSeccion, idPerfil) {
        if (!idPerfilXSeccion || Number.isNaN(Number(idPerfilXSeccion))) {
            const err = new Error('Parámetro id de sección inválido');
            err.status = 400;
            throw err;
        }
        const deleted = await this.profileRepo.deleteSection(idPerfilXSeccion, idPerfil);
        return deleted;
    }

}