const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    sendMessage,
    getMessages
} = require("../controllers/chatController");

// Send
router.post("/send", verifyToken, sendMessage);

// Get
router.get("/:id", verifyToken, getMessages);

module.exports = router;