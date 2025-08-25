import DBConfig from '../config/db-config';
import pkg from 'pg';
const { Client } = pkg;

export default class UniversityRepository {
    constructor() {
      this.client = new Client(DBConfig);
    }
  
    async connect() {
      if (!this.client._connected) {
        await this.client.connect();
        this.client._connected = true; // Marcar como conectado
      }
    }
  
    async disconnect() {
      if (this.client._connected) {
        await this.client.end();
        this.client._connected = false;
      }
    }
  
    async getByEmail(mail) {
      await this.connect();
      const res = await this.client.query('SELECT * FROM usuarios WHERE mail = $1', [mail]);
      return res.rows[0];
    }
}