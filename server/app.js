// app.js
import express from 'express';
// import { config } from 'dotenv';
import dotenv from 'dotenv'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connection from './database/dbConnection.js';
import { errorMiddleware } from './middlewares/error.js';
import userRouter from './routes/userRouter.js';
import {removeUnverifiedAccount} from  './automation/removeUnverifiedAccount.js'
// Load environment variables
// config({ path: "./config.env" });
dotenv.config();


export const app = express();


// Setup middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Setup routes

  app.use('/api/v1/user', userRouter);

//automation code
  removeUnverifiedAccount();
// Connect to DB
connection();



//all error class
app.use(errorMiddleware)