const express=require("express");
const { getSampeledata } = require("../controller/userController");


const router=express.Router();


router.get('/users',getSampeledata)

module.exports=router;