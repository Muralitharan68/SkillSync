const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const { getUserProfile } = require("../controllers/userController");

router.get("/:id", verifyToken, getUserProfile);

module.exports = router;