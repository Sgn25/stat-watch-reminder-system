const pool = require("../config/db");

exports.createParameters = async (req, res) => {
    const { userid, unitid, title, description, category, issue_date, expire_date } = req.body;

    try {
        // Check if user exists
        const userCheck = await pool.query(`SELECT * FROM usermaster WHERE userid = $1`, [userid]);
        if (userCheck.rowCount === 0) {
            return res.status(400).json({
                message: "Invalid userid: user does not exist"
            });
        }

        // Check if unit exists
        const unitCheck = await pool.query(`SELECT * FROM unitmaster WHERE unitid = $1`, [unitid]);
        if (unitCheck.rowCount === 0) {
            return res.status(400).json({
                message: "Invalid unitid: unit does not exist"
            });
        }

        // Proceed to insert
        const query = `
            INSERT INTO statutory_parameters (userid, unitid, title, description, category, issue_date, expire_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const result = await pool.query(query, [userid, unitid, title, description, category, issue_date, expire_date]);

        res.status(201).json({
            message: "Parameters created successfully",
            
        });

    } catch (error) {
        res.status(500).json({
            message: "Error creating parameters",
            error: error.message
        });
    }
};



exports.getParameters=async(req,res)=>{
    try {
        const query=
        `
        SELECT * FROM statutory_parameters 
        `
        const result=await pool.query(query)

        if(result.rows.length===0){
            return res.status(404).json({message:"No Parameters Found"})
        }
        res.status(200).json({
            message:"Parameters retrieved successfully",
            data:result.rows
        })
    } catch (error) {
        res.status(500).json({
            message:"Error retrieving parameters",
            error:error.message
        })
        
    }
}

exports.getParticularParameter=async(req,res)=>{
    const {parameterid}=req.params;
    try {
        const query=
        `
        SELECT * FROM statutory_parameters WHERE parameterid=$1
        `
        const result=await pool.query(query,[parameterid]);
        if(result.rows.length===0){
            return res.status(404).json({message:"Parameter Not Found"})
            
        }
        res.status(200).json({
            message:"Parameter retrieved successfully",
            data:result.rows[0]
        })
        
    } catch (error) {
        res.status(500).json({
            message:"Error retrieving parameter",
            error:error.message
        })
        
    }

}
exports.updateParameter = async (req, res) => {
    const { parameterid } = req.params;
    const { title, description, issue_date, expire_date } = req.body;

    try {
        const updates = [];
        const values = [];

        // Dynamically build SET clause and values array
        let index = 1;
        if (title !== undefined) {
            updates.push(`title = $${index++}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${index++}`);
            values.push(description);
        }
        if (issue_date !== undefined) {
            updates.push(`issue_date = $${index++}`);
            values.push(issue_date);
        }
        if (expire_date !== undefined) {
            updates.push(`expire_date = $${index++}`);
            values.push(expire_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        // Add parameterid as last parameter
        values.push(parameterid);


        const query = `
            UPDATE statutory_parameters
            SET ${updates.join(', ')}
            WHERE parameterid = $${values.length}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Parameter not found" });
        }

        res.status(200).json({
            message: "Parameter updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

