const db = require("../db");

// Add Skill
const addSkill = (req, res) => {

    const { skill_name, skill_level } = req.body;

    const user_id = req.user.id;

    const sql = `
        INSERT INTO skills (user_id, skill_name, skill_level)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [user_id, skill_name, skill_level], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            message: "Skill Added Successfully"
        });

    });

};

// Get My Skills
const getSkills = (req, res) => {

    const sql = `
        SELECT * FROM skills
        WHERE user_id = ?
        ORDER BY id DESC
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
            skills: result
        });

    });

};

// Update Skill
const updateSkill = (req, res) => {

    const { skill_name, skill_level } = req.body;

    const sql = `
        UPDATE skills
        SET skill_name = ?, skill_level = ?
        WHERE id = ? AND user_id = ?
    `;

    db.query(
        sql,
        [skill_name, skill_level, req.params.id, req.user.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                success: true,
                message: "Skill Updated Successfully"
            });

        }
    );

};

// Delete Skill
const deleteSkill = (req, res) => {

    const sql = `
        DELETE FROM skills
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [req.params.id, req.user.id], (err) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            message: "Skill Deleted Successfully"
        });

    });

};

module.exports = {
    addSkill,
    getSkills,
    updateSkill,
    deleteSkill
};