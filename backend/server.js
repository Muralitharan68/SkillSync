const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load .env file
dotenv.config();

const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const skillRoutes = require("./routes/skillRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("🚀 SkillSync Backend is Running...");
});

// Server Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});