const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    findSkills
} = require("../controllers/findSkillController");

router.get("/", verifyToken, findSkills);

module.exports = router;