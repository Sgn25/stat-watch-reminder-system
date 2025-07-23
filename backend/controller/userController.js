const pool = require("../config/db")


//get method
exports.getSampeledata=async(req,res)=>{
    try {
        //sample query
        const query=`
        SELECT * FROM personmaster`
        const result=await pool.query(query)
        if(result.rows.length===0){
            return res.status(404).json({
                message:"No data found"
            })
        }
        return res.status(200).json(result.rows)
    } catch (error) {
        res.status(500).json({
            message:"Internal server error"
        })
    }

}

//post method
exports.postdata=async(req,res)=>{
    const {data1,data2}=req.body
    try {
        const query=`
        INSERT INTO personmaster (data1,data2) VALUES ($1,$2) RETURNING *`
        const result=await pool.query(query,[data1,data2])
        res.status(201).json({
            message:"Data inserted successfully",
        })
    } catch (error) {
        res.status
    }

}


//put method
exports.putdata=async(req,res)=>{
    const {id}=req.params;
    try {
        const query=`
        UPDATE personmaster SET data1=$1,data2=$2 WHERE id=$3
        `
        const result =await pool.query(query,[data1,data2,id])
        res.status(200).json({
            message:"Data updated successfully"
        })

    } catch (error) {
        res.status(500).json({
            message:"Internal Server Error"
        })
        
    }
}


//delete method 

exports.deleteUser=async(req,res)=>{
    const {id}=req.params
    try {
        const query=
        "DELETE FROM personmaster WHERE id=$1"
        const result=await pool.query(query,[id])
        res.status(201).json({
            message:"User deleted successfully"
        })
    } catch (error) {
                res.status(500).json({
            message:"Internal Server Error"
        })
    }
}




//4 http method get,post,put,delete