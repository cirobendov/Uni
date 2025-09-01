import express from 'express';
import cors from 'cors';
import UserController from './src/controllers/user-controller.js';
import UniversityController from './src/controllers/university-controller.js'
import CareerController from './src/controllers/career-controller.js'
import CategoryController from './src/controllers/category-controller.js'

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/user', UserController);
app.use('/university', UniversityController)
app.use('/career', CareerController)
app.use('/category', CategoryController)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
