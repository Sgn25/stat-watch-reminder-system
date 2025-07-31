const express = require("express");
const { getCategory, addCategory, deleteCategory } = require("../controller/categoryController");
const router=express.Router();


router.get('/get/category',getCategory)
router.post('/post/category',addCategory)
router.delete('/delete/category/:categoryid',deleteCategory)

module.exports=router;