const pool = require("../config/db")

exports.getUnits=async(req,res)=>{
    try {
        const query=`
        SELECT * FROM unitmaster
        `
        const result=await pool.query(query)
        if(result.rows.length===0){
            return res.status(404).json({
                message:"No units found"
            })
        }
        res.status(200).json({
            message:"Units found successfully",
            data:result.rows
        })
    } catch (error) {
        res.status(500).json({
            message:"Error fetching units",
            error:error.message
        })
    }

}