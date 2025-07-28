const express=require("express");
const { createParameters, getParameters, getParticularParameter, updateParameter } = require("../controller/parametersController");


const router=express.Router();

router.post('/parameters',createParameters)
router.get('/get/parameter',getParameters);
router.get('/get/particular/:parameterid',getParticularParameter);
router.put('/update/parameter/:parameterid',updateParameter)



module.exports=router;