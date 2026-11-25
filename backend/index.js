import "dotenv/config";              // MUST be the very first import in the file

import express from 'express'
import connectDb from './config/db.js';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import cors from "cors"
import userRouter from './routes/user.routes.js';
import messageRouter from './routes/message.route.js';
import groupRouter from './routes/group.route.js';
import { app, server } from './socket/socket.js';
const port=process.env.PORT||5000

// const app=express();

// app.get("/",(req,res)=>{
//     res.send("hello")
// })

// app.use("/api/auth",authRouter)
// app.use(express.json())
// app.use(cookieParser())
app.use(cors({
    origin :"http://localhost:5173",
    credentials:true
}))
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/group", groupRouter);

server.listen(port,()=>{
    connectDb()
    console.log("server started ")
})