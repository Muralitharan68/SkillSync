const express = require("express");

const router = express.Router();

const verifyToken =
    require("../middleware/authMiddleware");

const {
    sendMessage,
    getMessages,
    getUnreadCount,
    getChatList
} = require("../controllers/chatController");


// ===============================
// SEND MESSAGE
// ===============================

router.post(
    "/send",
    verifyToken,
    sendMessage
);


// ===============================
// CHAT LIST
// ===============================

router.get(
    "/list",
    verifyToken,
    getChatList
);


// ===============================
// UNREAD COUNT
// ===============================

router.get(
    "/unread/count",
    verifyToken,
    getUnreadCount
);


// ===============================
// GET PARTICULAR CHAT
// ===============================

router.get(
    "/:id",
    verifyToken,
    getMessages
);


module.exports = router;