import express from 'express';
import cors from 'cors';
import UserController from './src/controllers/user-controller.js';
import UniversityController from './src/controllers/university-controller.js'
import CareerController from './src/controllers/career-controller.js'
import CategoryController from './src/controllers/category-controller.js'
import QuestionController from './src/controllers/test_questions-controller.js'
import ChatbotController from './src/controllers/chatbot-controller.js'

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/user', UserController);
app.use('/university', UniversityController)
app.use('/career', CareerController)
app.use('/category', CategoryController)
app.use('/questions', QuestionController)
app.use('/chatbot', ChatbotController)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
