const Razorpay = require("razorpay");
const crypto = require("crypto");

const db = require("../db");


// ==========================================
// RAZORPAY INSTANCE
// ==========================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ==========================================
// CREATE RAZORPAY ORDER
// POST /api/payment/create-order
// ==========================================

const createOrder = async (req, res) => {

    try {

        const userId = req.user.id;
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            });
        }


        // Get session
        db.query(
            `SELECT * FROM sessions WHERE id = ?`,
            [session_id],
            async (err, results) => {

                if (err) {
                    console.error("Database Error:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message
                    });
                }


                // Session not found
                if (results.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Session not found"
                    });

                }


                const session = results[0];


                // Check requester
                if (Number(session.requester_id) !== Number(userId)) {

                    return res.status(403).json({
                        success: false,
                        message: "You are not allowed to pay for this session"
                    });

                }


                // Session must be accepted
                if (session.status !== "accepted") {

                    return res.status(400).json({
                        success: false,
                        message: "Session must be accepted before payment"
                    });

                }


                // Already paid
                if (session.payment_status === "paid") {

                    return res.status(400).json({
                        success: false,
                        message: "Payment already completed"
                    });

                }


                // Amount
                const amount = Number(session.amount);


                if (!amount || amount <= 0) {

                    return res.status(400).json({
                        success: false,
                        message: "Invalid session amount"
                    });

                }


                // Convert rupees → paise
                const amountInPaise = Math.round(amount * 100);


                // Razorpay order options
                const options = {
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: `session_${session_id}`,
                    notes: {
                        session_id: String(session_id),
                        requester_id: String(userId)
                    }
                };


                try {

                    // Create Razorpay order
                    const order = await razorpay.orders.create(options);


                    // Save order ID
                    db.query(
                        `UPDATE sessions
                         SET razorpay_order_id = ?,
                             payment_status = 'pending'
                         WHERE id = ?`,
                        [order.id, session_id],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    "Update Session Error:",
                                    updateErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message: "Order created but database update failed",
                                    error: updateErr.message
                                });

                            }


                            return res.status(200).json({

                                success: true,

                                message:
                                    "Razorpay order created successfully",

                                order: {
                                    id: order.id,
                                    amount: order.amount,
                                    currency: order.currency,
                                    session_id: session_id
                                },

                                key_id:
                                    process.env.RAZORPAY_KEY_ID

                            });

                        }
                    );

                } catch (razorpayError) {

                    console.error(
                        "Razorpay Error:",
                        razorpayError
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to create Razorpay order",

                        error:
                            razorpayError.message

                    });

                }

            }
        );

    } catch (error) {

        console.error(
            "Create Order Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to create payment order",

            error:
                error.message

        });

    }

};



// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
// ==========================================

const verifyPayment = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            session_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        // Required fields
        if (
            !session_id ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({
                success: false,
                message: "Payment details are missing"
            });

        }


        // Get session
        db.query(
            `SELECT * FROM sessions WHERE id = ?`,
            [session_id],
            (err, results) => {

                if (err) {

                    console.error(
                        "Database Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message
                    });

                }


                // Session not found
                if (results.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Session not found"
                    });

                }


                const session = results[0];


                // Check requester
                if (
                    Number(session.requester_id) !==
                    Number(userId)
                ) {

                    return res.status(403).json({
                        success: false,
                        message:
                            "You are not allowed to verify this payment"
                    });

                }


                // Check Razorpay order ID
                if (
                    session.razorpay_order_id !==
                    razorpay_order_id
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid Razorpay order ID"
                    });

                }


                // Generate signature
                const generatedSignature =
                    crypto
                        .createHmac(
                            "sha256",
                            process.env.RAZORPAY_KEY_SECRET
                        )
                        .update(
                            razorpay_order_id +
                            "|" +
                            razorpay_payment_id
                        )
                        .digest("hex");


                // Signature mismatch
                if (
                    generatedSignature !==
                    razorpay_signature
                ) {

                    db.query(
                        `UPDATE sessions
                         SET payment_status = 'failed'
                         WHERE id = ?`,
                        [session_id]
                    );

                    return res.status(400).json({
                        success: false,
                        message:
                            "Payment verification failed"
                    });

                }


                // Payment successful
                db.query(
                    `UPDATE sessions
                     SET payment_status = 'paid',
                         razorpay_payment_id = ?,
                         razorpay_signature = ?
                     WHERE id = ?`,
                    [
                        razorpay_payment_id,
                        razorpay_signature,
                        session_id
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "Payment Update Error:",
                                updateErr
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Payment verified but database update failed",
                                error:
                                    updateErr.message
                            });

                        }


                        return res.status(200).json({

                            success: true,

                            message:
                                "Payment verified successfully",

                            paymentStatus:
                                "paid",

                            sessionId:
                                session_id

                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "Verify Payment Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Payment verification failed",

            error:
                error.message

        });

    }

};


module.exports = {
    createOrder,
    verifyPayment
};