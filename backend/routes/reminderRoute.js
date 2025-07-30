const express=require("express");
const { reminderEmail } = require("../controller/reminderController");

const router=express.Router();

router.get('/reminder',reminderEmail)


module.exports=router;


