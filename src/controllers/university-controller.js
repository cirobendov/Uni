import { Router } from 'express';
import UniversityService from '../services/university-service.js';
import { StatusCodes } from 'http-status-codes';

const router = Router();
const service = new UniversityService();


export default router;
