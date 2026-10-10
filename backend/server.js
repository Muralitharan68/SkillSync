const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const db = require("./db");

const app = express();

// ============================================================
// HTTP SERVER
// ============================================================

const server =
    http.createServer(app);

// ============================================================
// SOCKET.IO
// ============================================================

const io =
    new Server(server, {

        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }

    });

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(
    express.json()
);

app.use(
    (req, res, next) => {

        console.log(
            req.method,
            req.url
        );

        next();
    }
);

// ============================================================
// ROUTES
// ============================================================

const authRoutes =
    require("./routes/authRoutes");

const skillRoutes =
    require("./routes/skillRoutes");

const findSkillRoutes =
    require("./routes/findSkillRoutes");

const userRoutes =
    require("./routes/userRoutes");

const chatRoutes =
    require("./routes/chatRoutes");

const sessionRoutes =
    require("./routes/sessionRoutes");

const paymentRoutes =
    require("./routes/paymentRoutes");

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/skills",
    skillRoutes
);

app.use(
    "/api/findskills",
    findSkillRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/chat",
    chatRoutes
);

app.use(
    "/api/sessions",
    sessionRoutes
);

app.use(
    "/api/payment",
    paymentRoutes
);

// ============================================================
// TEST ROUTE
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "🚀 SkillSync Backend is Running..."
        );
    }
);

// ============================================================
// SOCKET.IO
// ============================================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "🟢 Socket connected:",
            socket.id
        );

        // ====================================================
        // JOIN SESSION
        // ====================================================

        socket.on(
            "join-session",
            ({
                sessionId,
                userId,
                name
            }) => {

                try {

                    if (!sessionId) {

                        socket.emit(
                            "join-session-error",
                            {
                                message:
                                    "Session ID missing."
                            }
                        );

                        return;
                    }

                    const room =
                        `session-${sessionId}`;

                    // Remove previous session room
                    if (
                        socket.data.sessionRoom &&
                        socket.data.sessionRoom !== room
                    ) {

                        socket.leave(
                            socket.data.sessionRoom
                        );
                    }

                    socket.join(room);

                    socket.data.sessionId =
                        Number(sessionId);

                    socket.data.sessionRoom =
                        room;

                    socket.data.userId =
                        userId;

                    socket.data.name =
                        name || "User";

                    console.log(
                        `👤 ${name} joined ${room}`
                    );

                    console.log(
                        "🏠 Socket rooms:",
                        [...socket.rooms]
                    );

                    // Tell existing participants
                    socket.to(room).emit(
                        "user-joined",
                        {
                            userId,
                            name
                        }
                    );

                    // Tell joining user
                    socket.emit(
                        "joined-session",
                        {
                            sessionId:
                                Number(sessionId),

                            room
                        }
                    );

                } catch (error) {

                    console.error(
                        "Join session error:",
                        error
                    );

                    socket.emit(
                        "join-session-error",
                        {
                            message:
                                "Unable to join session."
                        }
                    );
                }
            }
        );

        // ====================================================
        // LIVE SESSION CHAT
        // ====================================================

        socket.on(
            "session-message",
            (
                {
                    sessionId,
                    messageId,
                    senderId,
                    senderName,
                    message
                },
                callback
            ) => {

                const room =
                    `session-${sessionId}`;

                console.log(
                    "--------------------------------"
                );

                console.log(
                    "💬 CHAT MESSAGE"
                );

                console.log(
                    "Socket:",
                    socket.id
                );

                console.log(
                    "Session:",
                    sessionId
                );

                console.log(
                    "Room:",
                    room
                );

                console.log(
                    "Sender:",
                    senderName,
                    senderId
                );

                console.log(
                    "Message:",
                    message
                );

                console.log(
                    "Socket rooms:",
                    [...socket.rooms]
                );

                // Check whether this socket is actually
                // inside the correct session room.
                if (
                    !socket.rooms.has(room)
                ) {

                    console.error(
                        "❌ Socket is NOT inside room:",
                        room
                    );

                    if (
                        typeof callback ===
                        "function"
                    ) {

                        callback({
                            success: false,
                            message:
                                "You are not connected to this session room."
                        });
                    }

                    socket.emit(
                        "session-message-error",
                        {
                            message:
                                "Session room connection lost. Please wait and try again."
                        }
                    );

                    return;
                }

                if (
                    !message ||
                    !String(message).trim()
                ) {

                    if (
                        typeof callback ===
                        "function"
                    ) {

                        callback({
                            success: false,
                            message:
                                "Message is empty."
                        });
                    }

                    return;
                }

                const cleanMessage =
                    String(message).trim();

                // IMPORTANT:
                // io.to(room) sends to EVERYONE in room,
                // including sender + receiver.
                io.to(room).emit(
                    "session-message",
                    {
                        messageId:
                            messageId ||
                            `${Date.now()}-${Math.random()}`,

                        sessionId:
                            Number(sessionId),

                        senderId:
                            senderId,

                        senderName:
                            senderName ||
                            "User",

                        message:
                            cleanMessage
                    }
                );

                console.log(
                    "✅ Message broadcast to room:",
                    room
                );

                if (
                    typeof callback ===
                    "function"
                ) {

                    callback({
                        success: true,
                        message:
                            "Message delivered."
                    });
                }

                console.log(
                    "--------------------------------"
                );
            }
        );

        // ====================================================
        // WEBRTC OFFER
        // ====================================================

        socket.on(
            "webrtc-offer",
            ({
                sessionId,
                offer
            }) => {

                const room =
                    `session-${sessionId}`;

                console.log(
                    `📡 WebRTC offer - Session ${sessionId}`
                );

                socket.to(room).emit(
                    "webrtc-offer",
                    {
                        offer
                    }
                );
            }
        );

        // ====================================================
        // WEBRTC ANSWER
        // ====================================================

        socket.on(
            "webrtc-answer",
            ({
                sessionId,
                answer
            }) => {

                const room =
                    `session-${sessionId}`;

                console.log(
                    `📡 WebRTC answer - Session ${sessionId}`
                );

                socket.to(room).emit(
                    "webrtc-answer",
                    {
                        answer
                    }
                );
            }
        );

        // ====================================================
        // ICE CANDIDATE
        // ====================================================

        socket.on(
            "webrtc-ice-candidate",
            ({
                sessionId,
                candidate
            }) => {

                const room =
                    `session-${sessionId}`;

                socket.to(room).emit(
                    "webrtc-ice-candidate",
                    {
                        candidate
                    }
                );
            }
        );

        // ====================================================
        // LEAVE SESSION
        // ====================================================

        socket.on(
            "leave-session",
            ({
                sessionId
            }) => {

                const room =
                    `session-${sessionId}`;

                console.log(
                    `🔴 User left session ${sessionId}`
                );

                socket.to(room).emit(
                    "user-left"
                );

                socket.leave(room);

                socket.data.sessionId =
                    null;

                socket.data.sessionRoom =
                    null;
            }
        );

        // ====================================================
        // DISCONNECT
        // ====================================================

        socket.on(
            "disconnect",
            (reason) => {

                const room =
                    socket.data.sessionRoom;

                console.log(
                    "🔴 Socket disconnected:",
                    socket.id,
                    reason
                );

                if (room) {

                    socket.to(room).emit(
                        "user-left"
                    );
                }
            }
        );
    }
);

// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 5000;

server.listen(
    PORT,
    () => {

        console.log(
            `🚀 SkillSync Backend running on http://localhost:${PORT}`
        );

        console.log(
            "🔌 Socket.IO server is ready"
        );
    }
);