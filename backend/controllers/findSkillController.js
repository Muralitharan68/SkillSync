const db = require("../db");

// Get All Users Skills Except Logged-in User
const findSkills = (req, res) => {

    console.log("Logged in User ID:", req.user.id);

    const sql = `
        SELECT
            users.id,
            users.name,
            users.email,
            users.college,
            users.department,
            skills.skill_name,
            skills.skill_level
        FROM users
        INNER JOIN skills
        ON users.id = skills.user_id
        WHERE users.id != ?
        ORDER BY users.name ASC
    `;

    db.query(sql, [req.user.id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            users: result
        });

    });

};

module.exports = {
    findSkills
};