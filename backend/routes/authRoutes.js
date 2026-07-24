const express = require("express");
const router = express.Router();

const { register, login, profile } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

// Register Route
router.post("/register", register);

// Login Route
router.post("/login", login);

//profile route
router.get("/profile", verifyToken, profile);

// Test Route
router.get("/test", (req, res) => {
    res.json({
        message: "Auth Route Working Successfully"
    });
});

module.exports = router;