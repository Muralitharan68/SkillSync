const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    createSession,
    getMySessions,
    getTeacherSessions,
    getSessionById,
    acceptSession,
    rejectSession,
    completeSession,
    cancelSession
} = require("../controllers/sessionController");


// =====================================================
// CREATE SESSION REQUEST
// POST /api/sessions/create
// =====================================================
router.post(
    "/create",
    verifyToken,
    createSession
);


// =====================================================
// GET MY REQUESTED SESSIONS
// GET /api/sessions/my
// =====================================================
router.get(
    "/my",
    verifyToken,
    getMySessions
);


// =====================================================
// GET SESSIONS WHERE I AM TEACHER
// GET /api/sessions/teacher
// =====================================================
router.get(
    "/teacher",
    verifyToken,
    getTeacherSessions
);


// =====================================================
// ACCEPT SESSION
// PUT /api/sessions/:id/accept
// =====================================================
router.put(
    "/:id/accept",
    verifyToken,
    acceptSession
);


// =====================================================
// REJECT SESSION
// PUT /api/sessions/:id/reject
// =====================================================
router.put(
    "/:id/reject",
    verifyToken,
    rejectSession
);


// =====================================================
// COMPLETE SESSION
// PUT /api/sessions/:id/complete
// =====================================================
router.put(
    "/:id/complete",
    verifyToken,
    completeSession
);


// =====================================================
// CANCEL SESSION
// PUT /api/sessions/:id/cancel
// =====================================================
router.put(
    "/:id/cancel",
    verifyToken,
    cancelSession
);


// =====================================================
// GET SINGLE SESSION
// GET /api/sessions/:id
// IMPORTANT: This must come AFTER special routes
// =====================================================
router.get(
    "/:id",
    verifyToken,
    getSessionById
);


module.exports = router;