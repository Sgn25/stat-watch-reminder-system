const pool = require("../config/db")

exports.getCategory=async(req,res)=>{
    try {
        const query=
        `
        SELECT * FROM category 
        `
        const result=await pool.query(query);

        if(result.rows.length===0){
            return res.status(404).json({message:"No category found"})
        }
        res.status(200).json(
            result.rows
        )
    } catch (error) {
        res.status(500).json({
            message:"Internal server error",
            error:error.message

        })
        
    }

}

exports.addCategory=async(req,res)=>{
    const {categoryname}=req.body
    try {
        const query=
        `
        INSERT INTO category (categoryname) VALUES ($1) RETURNING *
        `
        const result=await pool.query(query,[categoryname])
        res.status(201).json(result.rows[0])
    } catch (error) {
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }

}

exports.deleteCategory=async(req,res)=>{
    const {categoryid}=req.params;
    try {
        const query=`
        DELETE FROM category WHERE categoryid=$1 RETURNING *
        `
        const result=await pool.query(query,[categoryid])
        if(result.rows.length===0){
            return res.status(404).json({message:"No Data Found"})
        }
        res.status(404).json({
            message:"Deleted user Successfully",
            
        })

    } catch (error) {
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }
}