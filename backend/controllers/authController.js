const db = require("../db");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log("BODY:", req.body);

        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        db.query(sql, [name, email, hashedPassword], (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "User Registered Successfully"
            });

        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// login process

const login = (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            { id: user.id },
            "skillsync_secret",
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Login Successful",
            token
        });

    });

};

// profile process

const profile = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email,
            college,
            department,
            about
        FROM users
        WHERE id = ?
    `;

    db.query(sql, [req.user.id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: result[0]
        });

    });

};


const updateProfile = (req, res) => {

    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const { name, email, college, department, about } = req.body;

    const sql = `
        UPDATE users
        SET name = ?, email = ?, college = ?, department = ?, about = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [name, email, college, department, about, req.user.id],
        (err, result) => {

            if (err) {
                console.log("MYSQL ERROR:", err);   // 👈 idha add pannu

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                success: true,
                message: "Profile Updated Successfully"
            });

        }
    );

};

module.exports = {
    register,
    login,
    profile,
    updateProfile
};