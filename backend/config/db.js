const {Pool}=require("pg")
const dotenv=require("dotenv")

dotenv.config()

//make a .env file and add screat keys into this file
//for authentication use JWT package

const pool=new Pool({
user: process.env.DB_USER, 
  host: process.env.DB_HOST, 
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
})

pool.connect((err,client,release)=>{
    if(err){
        console.log("❌Error Connecting DataBase")
    }else{

    
    console.log("✔ Successfully connected to PostgreSQL database");
    release()
    }
})



module.exports=pool;