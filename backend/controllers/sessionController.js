const db = require("../db");

// =====================================================
// CREATE SESSION REQUEST
// =====================================================
const createSession = (req, res) => {
    const requester_id = Number(req.user.id);

    const {
        teacher_id,
        skill_name,
        session_date,
        session_time,
        duration_minutes,
        amount,
        message
    } = req.body;

    const teacherId = Number(teacher_id);
    const duration = Number(duration_minutes) || 60;
    const sessionAmount = Number(amount) || 0;

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!requester_id) {
        return res.status(401).json({
            success: false,
            message: "Invalid logged-in user"
        });
    }

    if (!teacherId) {
        return res.status(400).json({
            success: false,
            message: "Teacher ID is required"
        });
    }

    if (!skill_name || !skill_name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Skill name is required"
        });
    }

    if (requester_id === teacherId) {
        return res.status(400).json({
            success: false,
            message: "You cannot book a session with yourself"
        });
    }

    if (!session_date) {
        return res.status(400).json({
            success: false,
            message: "Session date is required"
        });
    }

    if (!session_time) {
        return res.status(400).json({
            success: false,
            message: "Session time is required"
        });
    }

    if (sessionAmount < 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid session amount"
        });
    }

    // =====================================================
    // CHECK TEACHER EXISTS
    // =====================================================
    const checkTeacherSQL = `
        SELECT
            id,
            name
        FROM users
        WHERE id = ?
        LIMIT 1
    `;

    db.query(checkTeacherSQL, [teacherId], (err, teacherResult) => {
        if (err) {
            console.error("Check Teacher Error:", err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (teacherResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher user does not exist"
            });
        }

        // =====================================================
        // CHECK DUPLICATE ACTIVE SESSION
        // =====================================================
        const duplicateSQL = `
            SELECT id
            FROM sessions
            WHERE requester_id = ?
              AND teacher_id = ?
              AND skill_name = ?
              AND session_date = ?
              AND session_time = ?
              AND status IN ('pending', 'accepted')
            LIMIT 1
        `;

        db.query(
            duplicateSQL,
            [
                requester_id,
                teacherId,
                skill_name.trim(),
                session_date,
                session_time
            ],
            (err, duplicateResult) => {
                if (err) {
                    console.error("Duplicate Session Error:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (duplicateResult.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "A session already exists for this date and time"
                    });
                }

                // =====================================================
                // INSERT SESSION
                // =====================================================
                const insertSQL = `
                    INSERT INTO sessions
                    (
                        requester_id,
                        teacher_id,
                        skill_name,
                        session_date,
                        session_time,
                        duration_minutes,
                        amount,
                        message,
                        status,
                        payment_status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
                `;

                db.query(
                    insertSQL,
                    [
                        requester_id,
                        teacherId,
                        skill_name.trim(),
                        session_date,
                        session_time,
                        duration,
                        sessionAmount,
                        message ? message.trim() : null
                    ],
                    (err, result) => {
                        if (err) {
                            console.error("Create Session Error:", err);

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        return res.status(201).json({
                            success: true,
                            message: "Session request created successfully",
                            sessionId: result.insertId
                        });
                    }
                );
            }
        );
    });
};


// =====================================================
// GET MY REQUESTED SESSIONS
// =====================================================
const getMySessions = (req, res) => {
    const userId = Number(req.user.id);

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid logged-in user"
        });
    }

    const sql = `
        SELECT
            s.id,
            s.requester_id,
            s.teacher_id,
            s.skill_name,
            s.session_date,
            s.session_time,
            s.duration_minutes,
            s.amount,
            s.message,
            s.status,
            s.payment_status,
            s.razorpay_order_id,
            s.razorpay_payment_id,
            s.created_at,

            u.name AS teacher_name,
            u.email AS teacher_email

        FROM sessions s

        INNER JOIN users u
            ON s.teacher_id = u.id

        WHERE s.requester_id = ?

        ORDER BY
            s.session_date DESC,
            s.session_time DESC,
            s.created_at DESC
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Get My Sessions Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        return res.json({
            success: true,
            sessions: result
        });
    });
};


// =====================================================
// GET SESSIONS WHERE CURRENT USER IS TEACHER
// =====================================================
const getTeacherSessions = (req, res) => {
    const teacherId = Number(req.user.id);

    if (!teacherId) {
        return res.status(401).json({
            success: false,
            message: "Invalid logged-in user"
        });
    }

    const sql = `
        SELECT
            s.id,
            s.requester_id,
            s.teacher_id,
            s.skill_name,
            s.session_date,
            s.session_time,
            s.duration_minutes,
            s.amount,
            s.message,
            s.status,
            s.payment_status,
            s.razorpay_order_id,
            s.razorpay_payment_id,
            s.created_at,

            u.name AS requester_name,
            u.email AS requester_email

        FROM sessions s

        INNER JOIN users u
            ON s.requester_id = u.id

        WHERE s.teacher_id = ?

        ORDER BY
            s.session_date DESC,
            s.session_time DESC,
            s.created_at DESC
    `;

    db.query(sql, [teacherId], (err, result) => {
        if (err) {
            console.error("Get Teacher Sessions Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        return res.json({
            success: true,
            sessions: result
        });
    });
};


// =====================================================
// GET SINGLE SESSION DETAILS
// =====================================================
const getSessionById = (req, res) => {
    const userId = Number(req.user.id);
    const sessionId = Number(req.params.id);

    if (!userId || !sessionId) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }

    const sql = `
        SELECT
            s.id,
            s.requester_id,
            s.teacher_id,
            s.skill_name,
            s.session_date,
            s.session_time,
            s.duration_minutes,
            s.amount,
            s.message,
            s.status,
            s.payment_status,
            s.razorpay_order_id,
            s.razorpay_payment_id,
            s.razorpay_signature,
            s.created_at,

            requester.name AS requester_name,
            requester.email AS requester_email,

            teacher.name AS teacher_name,
            teacher.email AS teacher_email

        FROM sessions s

        INNER JOIN users requester
            ON s.requester_id = requester.id

        INNER JOIN users teacher
            ON s.teacher_id = teacher.id

        WHERE
            s.id = ?
            AND (
                s.requester_id = ?
                OR
                s.teacher_id = ?
            )

        LIMIT 1
    `;

    db.query(
        sql,
        [sessionId, userId, userId],
        (err, result) => {
            if (err) {
                console.error("Get Session Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Session not found"
                });
            }

            return res.json({
                success: true,
                session: result[0]
            });
        }
    );
};


// =====================================================
// ACCEPT SESSION
// ONLY TEACHER CAN ACCEPT
// =====================================================
const acceptSession = (req, res) => {
    const teacherId = Number(req.user.id);
    const sessionId = Number(req.params.id);

    if (!teacherId || !sessionId) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }

    const checkSQL = `
        SELECT
            id,
            requester_id,
            teacher_id,
            status
        FROM sessions
        WHERE id = ?
        LIMIT 1
    `;

    db.query(checkSQL, [sessionId], (err, result) => {
        if (err) {
            console.error("Check Session Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const session = result[0];

        if (Number(session.teacher_id) !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Only the teacher can accept this session"
            });
        }

        if (session.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Session is already ${session.status}`
            });
        }

        const updateSQL = `
            UPDATE sessions
            SET status = 'accepted'
            WHERE id = ?
        `;

        db.query(updateSQL, [sessionId], (err) => {
            if (err) {
                console.error("Accept Session Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            return res.json({
                success: true,
                message: "Session accepted successfully"
            });
        });
    });
};


// =====================================================
// REJECT SESSION
// ONLY TEACHER CAN REJECT
// =====================================================
const rejectSession = (req, res) => {
    const teacherId = Number(req.user.id);
    const sessionId = Number(req.params.id);

    if (!teacherId || !sessionId) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }

    const checkSQL = `
        SELECT
            id,
            teacher_id,
            status
        FROM sessions
        WHERE id = ?
        LIMIT 1
    `;

    db.query(checkSQL, [sessionId], (err, result) => {
        if (err) {
            console.error("Check Session Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const session = result[0];

        if (Number(session.teacher_id) !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Only the teacher can reject this session"
            });
        }

        if (session.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Session is already ${session.status}`
            });
        }

        const updateSQL = `
            UPDATE sessions
            SET status = 'rejected'
            WHERE id = ?
        `;

        db.query(updateSQL, [sessionId], (err) => {
            if (err) {
                console.error("Reject Session Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            return res.json({
                success: true,
                message: "Session rejected successfully"
            });
        });
    });
};


// =====================================================
// COMPLETE SESSION
// REQUESTER OR TEACHER CAN COMPLETE
// =====================================================
const completeSession = (req, res) => {
    const userId = Number(req.user.id);
    const sessionId = Number(req.params.id);

    if (!userId || !sessionId) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }

    const checkSQL = `
        SELECT
            id,
            requester_id,
            teacher_id,
            status
        FROM sessions
        WHERE id = ?
        LIMIT 1
    `;

    db.query(checkSQL, [sessionId], (err, result) => {
        if (err) {
            console.error("Check Session Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const session = result[0];

        const isParticipant =
            Number(session.requester_id) === userId ||
            Number(session.teacher_id) === userId;

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not part of this session"
            });
        }

        if (session.status !== "accepted") {
            return res.status(400).json({
                success: false,
                message: "Only an accepted session can be completed"
            });
        }

        const updateSQL = `
            UPDATE sessions
            SET status = 'completed'
            WHERE id = ?
        `;

        db.query(updateSQL, [sessionId], (err) => {
            if (err) {
                console.error("Complete Session Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            return res.json({
                success: true,
                message: "Session marked as completed"
            });
        });
    });
};


// =====================================================
// CANCEL SESSION
// REQUESTER OR TEACHER CAN CANCEL
// =====================================================
const cancelSession = (req, res) => {
    const userId = Number(req.user.id);
    const sessionId = Number(req.params.id);

    if (!userId || !sessionId) {
        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }

    const checkSQL = `
        SELECT
            id,
            requester_id,
            teacher_id,
            status,
            payment_status
        FROM sessions
        WHERE id = ?
        LIMIT 1
    `;

    db.query(checkSQL, [sessionId], (err, result) => {
        if (err) {
            console.error("Check Session Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const session = result[0];

        const isParticipant =
            Number(session.requester_id) === userId ||
            Number(session.teacher_id) === userId;

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not part of this session"
            });
        }

        if (
            session.status === "completed" ||
            session.status === "cancelled" ||
            session.status === "rejected"
        ) {
            return res.status(400).json({
                success: false,
                message: `Session is already ${session.status}`
            });
        }

        const updateSQL = `
            UPDATE sessions
            SET status = 'cancelled'
            WHERE id = ?
        `;

        db.query(updateSQL, [sessionId], (err) => {
            if (err) {
                console.error("Cancel Session Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            return res.json({
                success: true,
                message: "Session cancelled successfully",
                paymentStatus: session.payment_status
            });
        });
    });
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {
    createSession,
    getMySessions,
    getTeacherSessions,
    getSessionById,
    acceptSession,
    rejectSession,
    completeSession,
    cancelSession
};