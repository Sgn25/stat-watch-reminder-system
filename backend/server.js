const express=require("express");
const pool = require("./config/db");
const userRoute=require('./routes/userRoute.js')

const app=express();
app.use(express.json())
app.use('/get',userRoute)



app.listen(5000,()=>{
    console.log("server is running on port 5000");
})