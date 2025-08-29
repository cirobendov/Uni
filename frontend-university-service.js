import axios from 'axios';

const API_URL = 'http://localhost:3000/university/';

// Configurar axios con el token de autenticación
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config) => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    const token = user.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const universityService = {
  async getAll() {
    try {
      const response = await api.get(''); // GET, no POST
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     "Error al obtener universidades";
      throw new Error(message);
    }
  },
   
  async getAllExpanded() {
    try {
      const response = await api.get('expanded'); // GET, no POST
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     "Error al obtener universidades expandidas";
      throw new Error(message);
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`${id}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     "Error al obtener universidad";
      throw new Error(message);
    }
  }
};

export default universityService;
