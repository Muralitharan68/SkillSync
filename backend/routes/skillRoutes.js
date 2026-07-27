const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    addSkill,
    getSkills,
    updateSkill,
    deleteSkill
} = require("../controllers/skillController");

// Add Skill
router.post("/", verifyToken, addSkill);

// Get My Skills
router.get("/", verifyToken, getSkills);

// Update Skill
router.put("/:id", verifyToken, updateSkill);

// Delete Skill
router.delete("/:id", verifyToken, deleteSkill);

module.exports = router;