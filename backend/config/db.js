const {Pool}=require("pg")
const dotenv=require("dotenv")

dotenv.config()

//make a .env file and add screat keys into this file
//for authentication use JWT package

const pool=new Pool({
user: "postgres", 
  host: "192.168.106.102", 
  database: "stat_monitor",
  password: "Milma@123",
  port: "5432",
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