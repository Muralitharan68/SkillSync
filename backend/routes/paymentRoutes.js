const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    createOrder,
    verifyPayment
} = require("../controllers/paymentController");


// ==========================================
// CREATE RAZORPAY ORDER
// POST /api/payment/create-order
// ==========================================
router.post(
    "/create-order",
    verifyToken,
    createOrder
);


// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
// ==========================================
router.post(
    "/verify",
    verifyToken,
    verifyPayment
);


module.exports = router;