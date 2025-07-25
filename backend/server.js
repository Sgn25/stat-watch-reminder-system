const express=require("express");
const pool = require("./config/db");
const userRoute=require('./routes/userRoute.js')
const cors=require("cors")
const cron=require("node-cron")



const app=express();
app.use(express.json())
app.use(cors())
app.use('/get',userRoute)



app.listen(5000,()=>{
    console.log("server is running on port 5000");
})

cron.schedule('* * * * *',()=>{
    console.log('running a task every minute')
    //you can put your task here
})


