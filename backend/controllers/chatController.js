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

    // First check receiver exists
    const checkUserSQL = `
        SELECT id, name
        FROM users
        WHERE id = ?
        LIMIT 1
    `;

    db.query(checkUserSQL, [receiverId], (err, users) => {

        if (err) {
            console.log("Receiver Check Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        // Receiver doesn't exist
        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Receiver user does not exist"
            });

        }

        // Receiver exists → insert message
        const insertSQL = `
            INSERT INTO messages
            (sender_id, receiver_id, message)
            VALUES (?, ?, ?)
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

                    console.log("Send Message Error:", err);

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

    });

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

    // Check receiver exists
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

                console.log("Receiver Check Error:", err);

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

            // Load messages
            const sql = `
                SELECT
                    id,
                    sender_id,
                    receiver_id,
                    message,
                    sent_at
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

                        console.log("Get Messages Error:", err);

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

};


module.exports = {
    sendMessage,
    getMessages
};