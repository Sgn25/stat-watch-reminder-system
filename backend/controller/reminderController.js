const pool=require('../config/db')
exports.reminderEmail=async(req,res)=>{
    try {
        const query=`
        SELECT 
    usm.username,
    usm.useremail,
    sp.title,
    sp.description,
    sp.issue_date,
    sp.expire_date,
    um.unitname,
    ca.categoryname,
    CASE
        WHEN sp.expire_date < CURRENT_DATE THEN 'Expired'
        WHEN sp.expire_date <= CURRENT_DATE + INTERVAL '5 days' THEN 'Expiring Soon'
        ELSE 'Valid'
    END AS status
FROM 
    statutory_parameters sp
JOIN 
    unitmaster um ON um.unitid = sp.unitid
JOIN 
    category ca ON ca.categoryid = sp.category
JOIN 
    usermaster usm ON usm.userid = sp.userid
WHERE 
    sp.expire_date < CURRENT_DATE + INTERVAL '6 days'
    ORDER BY sp.parameterid

        `

        const result=await pool.query(query);
        if(result.rows.length === 0){
            return res.json(404).json({
                message:"No reminders found"
            })
        }
        return res.status(200).json({
            message:"Reminders found",
            reminders:result.rows
        })
    } catch (error) {
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }

}