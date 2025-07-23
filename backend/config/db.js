const {Pool}=require("pg")
const dotenv=require("dotenv")

dotenv.config()

//make a .env file and add screat keys into this file
//for authentication 

const pool=new Pool({
user: 'postgres', // user:process.env.userName
  host: 'host_address', // user:process.env.host
  database: 'database_name',
  password: 'password',
  port: 5432,


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