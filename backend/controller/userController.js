const pool = require("../config/db")
const bcrypt = require("bcrypt")
const jwt=require("jsonwebtoken")
const dotenv=require("dotenv")


dotenv.config();



//get method
exports.registerUser=async(req,res)=>{
    const {username,useremail,password,unitid}=req.body; 
    try {
        const hashPassword=await bcrypt.hash(password,10);
        const alreadyEmailFound=await pool.query(`SELECT * FROM usermaster WHERE useremail=$1`,[useremail])
        if(alreadyEmailFound.rows.length>0){
            return res.status(404).json({
                message:"Email already exists"
            })
        }
        const query=
        `
        INSERT INTO usermaster (username,useremail,password,unitid) VALUES ($1,$2,$3,$4)
        `
        const result=await pool.query(query,[username,useremail,hashPassword,unitid])
        res.status(201).json({
            message:"User created successfully",
        })


        
    } catch (error) {
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }
}


exports.loginUser=async(req,res)=>{
    const {useremail,password}=req.body;
    try {
        const query=
        `
        SELECT * FROM usermaster WHERE useremail=$1
        `
        const result=await pool.query(query,[useremail])

        if(result.rows.length===0){
            return res.status(404).json({
                message:"Email not found"
            })
        }
        const user=result.rows[0];
        const isPasswordMatch=await bcrypt.compare(password,user.password);
        if(!isPasswordMatch){
           return res.status(401).json({
                message:"Invalid Password"
            })
        }

        const token=jwt.sign({id:user.id,email:user.email},process.env.SECRET_KEY ,{expiresIn:"1h"})

        res.status(200).json({
            message:"Login Successfull",
            token:token,
            user: {
               username:user.username,
               useremail: user.useremail,
               userunit:user.unitid
            }
        })

        
    } catch (error) {
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }
}

