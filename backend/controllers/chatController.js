const db = require("../db");


// ===============================
// SEND MESSAGE
// ===============================
const sendMessage = (req, res) => {

    const sender_id = Number(req.user.id);
    const { receiver_id, message } = req.body;

    if (!sender_id || !receiver_id || !message || !message.trim()) {

        return res.status(400).json({
            success: false,
            message: "Sender, receiver and message are required"
        });

    }

    const receiverId = Number(receiver_id);

    if (!receiverId) {

        return res.status(400).json({
            success: false,
            message: "Invalid receiver user ID"
        });

    }

    if (sender_id === receiverId) {

        return res.status(400).json({
            success: false,
            message: "You cannot send a message to yourself"
        });

    }


    // ===============================
    // CHECK RECEIVER
    // ===============================

    const checkUserSQL = `
        SELECT id, name
        FROM users
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        checkUserSQL,
        [receiverId],
        (err, users) => {

            if (err) {

                console.log(
                    "Receiver Check Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Receiver user does not exist"
                });

            }


            // ===============================
            // INSERT MESSAGE
            // ===============================

            const insertSQL = `
                INSERT INTO messages
                (
                    sender_id,
                    receiver_id,
                    message,
                    is_read
                )
                VALUES (?, ?, ?, 0)
            `;

            db.query(
                insertSQL,
                [
                    sender_id,
                    receiverId,
                    message.trim()
                ],
                (err, result) => {

                    if (err) {

                        console.log(
                            "Send Message Error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    }


                    res.json({
                        success: true,
                        message: "Message Sent Successfully",
                        messageId: result.insertId
                    });

                }
            );

        }
    );

};


// ===============================
// GET CHAT MESSAGES
// ===============================
const getMessages = (req, res) => {

    const sender = Number(req.user.id);
    const receiver = Number(req.params.id);

    if (!sender || !receiver) {

        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });

    }


    // ===============================
    // CHECK RECEIVER
    // ===============================

    const checkUserSQL = `
        SELECT id, name
        FROM users
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        checkUserSQL,
        [receiver],
        (err, users) => {

            if (err) {

                console.log(
                    "Receiver Check Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Receiver user does not exist"
                });

            }


            // ===============================
            // MARK RECEIVED MESSAGES AS READ
            // ===============================

            const markReadSQL = `
                UPDATE messages
                SET is_read = 1
                WHERE
                    sender_id = ?
                    AND receiver_id = ?
                    AND is_read = 0
            `;

            db.query(
                markReadSQL,
                [
                    receiver,
                    sender
                ],
                (readErr) => {

                    if (readErr) {

                        console.log(
                            "Mark Read Error:",
                            readErr
                        );

                    }


                    // ===============================
                    // LOAD CHAT
                    // ===============================

                    const sql = `
                        SELECT
                            id,
                            sender_id,
                            receiver_id,
                            message,
                            sent_at,
                            is_read
                        FROM messages
                        WHERE
                            (sender_id = ? AND receiver_id = ?)
                            OR
                            (sender_id = ? AND receiver_id = ?)
                        ORDER BY sent_at ASC
                    `;

                    db.query(
                        sql,
                        [
                            sender,
                            receiver,
                            receiver,
                            sender
                        ],
                        (err, result) => {

                            if (err) {

                                console.log(
                                    "Get Messages Error:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });

                            }


                            res.json({
                                success: true,
                                messages: result
                            });

                        }
                    );

                }
            );

        }
    );

};


// ===============================
// GET UNREAD MESSAGE COUNT
// ===============================
const getUnreadCount = (req, res) => {

    const receiverId = Number(req.user.id);

    const sql = `
        SELECT COUNT(*) AS unreadCount
        FROM messages
        WHERE
            receiver_id = ?
            AND is_read = 0
    `;

    db.query(
        sql,
        [receiverId],
        (err, result) => {

            if (err) {

                console.log(
                    "Unread Count Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            res.json({
                success: true,
                unreadCount:
                    Number(result[0].unreadCount) || 0
            });

        }
    );

};


// ===============================
// GET CHAT LIST
// ===============================
const getChatList = (req, res) => {

    const currentUserId =
        Number(req.user.id);

    if (!currentUserId) {

        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });

    }


    const sql = `
        SELECT
            u.id AS user_id,
            u.name,

            (
                SELECT m2.message
                FROM messages m2
                WHERE
                    (
                        m2.sender_id = ?
                        AND m2.receiver_id = u.id
                    )
                    OR
                    (
                        m2.sender_id = u.id
                        AND m2.receiver_id = ?
                    )
                ORDER BY
                    m2.sent_at DESC,
                    m2.id DESC
                LIMIT 1
            ) AS last_message,

            (
                SELECT m3.sent_at
                FROM messages m3
                WHERE
                    (
                        m3.sender_id = ?
                        AND m3.receiver_id = u.id
                    )
                    OR
                    (
                        m3.sender_id = u.id
                        AND m3.receiver_id = ?
                    )
                ORDER BY
                    m3.sent_at DESC,
                    m3.id DESC
                LIMIT 1
            ) AS last_message_time,

            (
                SELECT COUNT(*)
                FROM messages m4
                WHERE
                    m4.sender_id = u.id
                    AND m4.receiver_id = ?
                    AND m4.is_read = 0
            ) AS unreadCount

        FROM users u

        WHERE u.id IN (

            SELECT DISTINCT
                CASE
                    WHEN sender_id = ?
                    THEN receiver_id
                    ELSE sender_id
                END
            FROM messages

            WHERE
                sender_id = ?
                OR receiver_id = ?

        )

        ORDER BY last_message_time DESC
    `;


    const params = [

        currentUserId,
        currentUserId,

        currentUserId,
        currentUserId,

        currentUserId,

        currentUserId,
        currentUserId,
        currentUserId

    ];


    db.query(
        sql,
        params,
        (err, result) => {

            if (err) {

                console.log(
                    "Chat List Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            res.json({
                success: true,
                chats: result
            });

        }
    );

};


// ===============================
// EXPORT
// ===============================

module.exports = {
    sendMessage,
    getMessages,
    getUnreadCount,
    getChatList
};