const db = require("../db");

// ===============================
// GET USER PROFILE
// ===============================
const getUserProfile = (req, res) => {

    const userId = Number(req.params.id);

    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "Invalid User ID"
        });

    }

    const sql = `
        SELECT
            users.id,
            users.name,
            users.email,
            users.college,
            users.department,
            users.about,
            skills.skill_name,
            skills.skill_level
        FROM users
        LEFT JOIN skills
        ON users.id = skills.user_id
        WHERE users.id = ?
    `;

    db.query(
        sql,
        [userId],
        (err, result) => {

            if (err) {

                console.log("Get User Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User Not Found"
                });

            }

            const firstRow = result[0];

            const user = {
                id: firstRow.id,
                name: firstRow.name,
                email: firstRow.email,
                college: firstRow.college,
                department: firstRow.department,
                about: firstRow.about,
                skills: []
            };

            result.forEach(row => {

                if (row.skill_name) {

                    user.skills.push({
                        name: row.skill_name,
                        level: row.skill_level
                    });

                }

            });

            res.json({
                success: true,
                user: user
            });

        }
    );

};


module.exports = {
    getUserProfile
};