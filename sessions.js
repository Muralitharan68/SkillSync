// ============================================================
// SKILLSYNC - SESSIONS
// SESSION MANAGEMENT + SOCKET.IO + WEBRTC + LIVE CHAT
// ============================================================

const API_URL = "http://localhost:5000";

// ============================================================
// SOCKET.IO
// ============================================================

const socket = io(API_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000
});

// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentSessionId = null;
let currentSession = null;

let currentUser = {
    id: null,
    name: "You"
};

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let screenStream = null;

let pendingIceCandidates = [];
let isMakingOffer = false;

let sessionTimerInterval = null;

// IMPORTANT: socket room join status
let socketSessionJoined = false;

// Avoid duplicate chat messages
const receivedMessageIds = new Set();

// ============================================================
// WEBRTC CONFIG
// ============================================================

const rtcConfig = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

// ============================================================
// TOKEN
// ============================================================

function getToken() {
    return localStorage.getItem("token");
}

// ============================================================
// CURRENT USER FROM JWT
// ============================================================

function getCurrentUserFromToken() {

    const token = getToken();

    if (!token) {
        return {
            id: null,
            name: "You"
        };
    }

    try {

        const payloadPart = token.split(".")[1];

        const normalized = payloadPart
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded = normalized.padEnd(
            normalized.length +
            ((4 - normalized.length % 4) % 4),
            "="
        );

        const payload = JSON.parse(
            atob(padded)
        );

        return {
            id:
                payload.id ||
                payload.userId ||
                payload.user_id ||
                null,

            name:
                payload.name ||
                payload.username ||
                payload.full_name ||
                "You"
        };

    } catch (error) {

        console.error("JWT error:", error);

        return {
            id: null,
            name: "You"
        };
    }
}

// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        currentUser = getCurrentUserFromToken();

        if (!getToken()) {

            alert("Please login first.");

            window.location.href = "login.html";

            return;
        }

        loadSessions();
    }
);

// ============================================================
// SOCKET CONNECT
// ============================================================

socket.on(
    "connect",
    async function () {

        console.log(
            "🟢 Socket.IO connected:",
            socket.id
        );

        socketSessionJoined = false;

        // If page reconnects while inside a session,
        // automatically join the room again.
        if (
            currentSessionId &&
            currentUser.id
        ) {

            console.log(
                "🔄 Rejoining session:",
                currentSessionId
            );

            socket.emit(
                "join-session",
                {
                    sessionId: currentSessionId,
                    userId: currentUser.id,
                    name: currentUser.name
                }
            );
        }
    }
);

socket.on(
    "disconnect",
    function (reason) {

        socketSessionJoined = false;

        console.log(
            "🔴 Socket.IO disconnected:",
            reason
        );
    }
);

socket.on(
    "connect_error",
    function (error) {

        console.error(
            "❌ Socket connection error:",
            error
        );
    }
);

// ============================================================
// SOCKET JOINED SESSION
// ============================================================

socket.on(
    "joined-session",
    function (data) {

        socketSessionJoined = true;

        console.log(
            "✅ Joined Socket.IO session room:",
            data.sessionId
        );

        // If learner/requester reconnects,
        // give some time for teacher to be inside room.
        if (
            currentSession &&
            isRequester()
        ) {

            setTimeout(
                function () {
                    createOffer();
                },
                700
            );
        }
    }
);

// ============================================================
// SOCKET JOIN ERROR
// ============================================================

socket.on(
    "join-session-error",
    function (data) {

        socketSessionJoined = false;

        console.error(
            "❌ Session join error:",
            data
        );

        alert(
            data?.message ||
            "Unable to join live session."
        );
    }
);

// ============================================================
// TAB
// ============================================================

function showTab(
    tabName,
    button
) {

    document
        .querySelectorAll(".session-section")
        .forEach(section => {

            section.classList.add("hidden");

        });

    const section =
        document.getElementById(tabName);

    if (section) {
        section.classList.remove("hidden");
    }

    document
        .querySelectorAll(".tab")
        .forEach(tab => {

            tab.classList.remove("active");

        });

    if (button) {
        button.classList.add("active");
    }
}

// ============================================================
// LOAD BOTH SESSION TYPES
// ============================================================

async function loadSessions() {

    const token = getToken();

    if (!token) {
        return;
    }

    await Promise.all([
        loadMySessions(token),
        loadTeacherSessions(token)
    ]);
}

// ============================================================
// MY SESSIONS
// ============================================================

async function loadMySessions(token) {

    const container =
        document.getElementById(
            "mySessionsContainer"
        );

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/sessions/my`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();

        if (!data.success) {

            container.innerHTML =
                `<div class="empty">
                    Failed to load sessions.
                </div>`;

            return;
        }

        const sessions =
            data.sessions || [];

        const count =
            document.getElementById("myCount");

        if (count) {
            count.textContent =
                sessions.length;
        }

        if (!sessions.length) {

            container.innerHTML =
                `<div class="empty">
                    No sessions found.
                </div>`;

            return;
        }

        container.innerHTML =
            sessions
                .map(createMySessionCard)
                .join("");

    } catch (error) {

        console.error(
            "My Sessions:",
            error
        );

        container.innerHTML =
            `<div class="empty">
                Server connection failed.
            </div>`;
    }
}

// ============================================================
// TEACHER SESSIONS
// ============================================================

async function loadTeacherSessions(token) {

    const container =
        document.getElementById(
            "teacherSessionsContainer"
        );

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/sessions/teacher`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();

        if (!data.success) {

            container.innerHTML =
                `<div class="empty">
                    Failed to load requests.
                </div>`;

            return;
        }

        const sessions =
            data.sessions || [];

        const count =
            document.getElementById(
                "teacherCount"
            );

        if (count) {
            count.textContent =
                sessions.length;
        }

        if (!sessions.length) {

            container.innerHTML =
                `<div class="empty">
                    No teacher requests found.
                </div>`;

            return;
        }

        container.innerHTML =
            sessions
                .map(createTeacherSessionCard)
                .join("");

    } catch (error) {

        console.error(
            "Teacher Sessions:",
            error
        );

        container.innerHTML =
            `<div class="empty">
                Server connection failed.
            </div>`;
    }
}

// ============================================================
// MY SESSION CARD
// ============================================================

function createMySessionCard(session) {

    const payButton =
        session.status === "accepted" &&
        session.payment_status !== "paid"

            ? `
                <button
                    class="action-btn pay-btn"
                    onclick="payForSession(${session.id})">
                    💳 Pay ₹${session.amount}
                </button>
            `
            : "";

    const startButton =
        session.status === "accepted" &&
        session.payment_status === "paid"

            ? `
                <button
                    class="action-btn start-btn"
                    onclick="startSession(${session.id})">
                    🎓 Start Session
                </button>
            `
            : "";

    const cancelButton =
        session.status === "pending"

            ? `
                <button
                    class="action-btn cancel-btn"
                    onclick="cancelSession(${session.id})">
                    Cancel
                </button>
            `
            : "";

    return `
        <div class="session-card">

            <div class="card-header">

                <div class="skill-name">
                    ${escapeHTML(session.skill_name)}
                </div>

                <span class="status ${escapeHTML(session.status)}">
                    ${escapeHTML(session.status)}
                </span>

            </div>

            <div class="session-details">

                <div class="detail">
                    <span>Teacher</span>
                    <strong>
                        ${escapeHTML(
                            session.teacher_name ||
                            "Unknown"
                        )}
                    </strong>
                </div>

                <div class="detail">
                    <span>Date</span>
                    <strong>
                        ${formatDate(
                            session.session_date
                        )}
                    </strong>
                </div>

                <div class="detail">
                    <span>Time</span>
                    <strong>
                        ${escapeHTML(
                            session.session_time ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="detail">
                    <span>Duration</span>
                    <strong>
                        ${session.duration_minutes || 60}
                        minutes
                    </strong>
                </div>

            </div>

            <div class="message-box">

                <span>Message:</span>

                ${escapeHTML(
                    session.message ||
                    "No message"
                )}

            </div>

            <div class="payment">

                <div class="amount">
                    ₹${session.amount}
                </div>

                <div class="payment-status">
                    Payment:
                    ${escapeHTML(
                        session.payment_status ||
                        "pending"
                    )}
                </div>

            </div>

            <div class="actions">

                ${payButton}
                ${startButton}
                ${cancelButton}

            </div>

        </div>
    `;
}

// ============================================================
// TEACHER SESSION CARD
// ============================================================

function createTeacherSessionCard(session) {

    let actions = "";

    if (session.status === "pending") {

        actions = `
            <button
                class="action-btn accept-btn"
                onclick="acceptSession(${session.id})">
                Accept
            </button>

            <button
                class="action-btn reject-btn"
                onclick="rejectSession(${session.id})">
                Reject
            </button>
        `;
    }

    if (session.status === "accepted") {

        actions = `
            <button
                class="action-btn accept-btn"
                onclick="startSession(${session.id})">
                🎓 Join Session
            </button>

            <button
                class="action-btn complete-btn"
                onclick="completeSession(${session.id})">
                Complete
            </button>
        `;
    }

    return `
        <div class="session-card">

            <div class="card-header">

                <div class="skill-name">
                    ${escapeHTML(session.skill_name)}
                </div>

                <span class="status ${escapeHTML(session.status)}">
                    ${escapeHTML(session.status)}
                </span>

            </div>

            <div class="session-details">

                <div class="detail">
                    <span>Learner</span>
                    <strong>
                        ${escapeHTML(
                            session.requester_name ||
                            "Unknown"
                        )}
                    </strong>
                </div>

                <div class="detail">
                    <span>Date</span>
                    <strong>
                        ${formatDate(
                            session.session_date
                        )}
                    </strong>
                </div>

                <div class="detail">
                    <span>Time</span>
                    <strong>
                        ${escapeHTML(
                            session.session_time ||
                            "-"
                        )}
                    </strong>
                </div>

                <div class="detail">
                    <span>Duration</span>
                    <strong>
                        ${session.duration_minutes || 60}
                        minutes
                    </strong>
                </div>

            </div>

            <div class="message-box">

                <span>Message:</span>

                ${escapeHTML(
                    session.message ||
                    "No message"
                )}

            </div>

            <div class="payment">

                <div class="amount">
                    ₹${session.amount}
                </div>

                <div class="payment-status">
                    Payment:
                    ${escapeHTML(
                        session.payment_status ||
                        "pending"
                    )}
                </div>

            </div>

            <div class="actions">
                ${actions}
            </div>

        </div>
    `;
}

// ============================================================
// PAYMENT
// ============================================================

async function payForSession(sessionId) {

    const token = getToken();

    try {

        const response = await fetch(
            `${API_URL}/api/payment/create-order`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    session_id: sessionId
                })
            }
        );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.message ||
                "Unable to create payment."
            );

            return;
        }

        const options = {

            key: data.key_id,

            amount: data.order.amount,

            currency: data.order.currency,

            name: "SkillSync",

            description:
                "Learning Session Payment",

            order_id: data.order.id,

            handler:
                async function(paymentResponse) {

                    await verifyPayment(
                        sessionId,
                        paymentResponse
                    );
                },

            theme: {
                color: "#6c4df6"
            }
        };

        const razorpay =
            new Razorpay(options);

        razorpay.on(
            "payment.failed",
            function() {

                alert(
                    "Payment failed. Please try again."
                );
            }
        );

        razorpay.open();

    } catch (error) {

        console.error(
            "Payment:",
            error
        );

        alert(
            "Unable to start payment."
        );
    }
}

// ============================================================
// VERIFY PAYMENT
// ============================================================

async function verifyPayment(
    sessionId,
    paymentResponse
) {

    try {

        const response = await fetch(
            `${API_URL}/api/payment/verify`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${getToken()}`
                },

                body: JSON.stringify({

                    session_id:
                        sessionId,

                    razorpay_order_id:
                        paymentResponse
                            .razorpay_order_id,

                    razorpay_payment_id:
                        paymentResponse
                            .razorpay_payment_id,

                    razorpay_signature:
                        paymentResponse
                            .razorpay_signature

                })
            }
        );

        const data =
            await response.json();

        if (data.success) {

            alert(
                "🎉 Payment successful!"
            );

            loadSessions();

        } else {

            alert(
                data.message ||
                "Payment verification failed."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Payment verification failed."
        );
    }
}

// ============================================================
// SESSION ACTIONS
// ============================================================

async function acceptSession(id) {
    await sessionAction(id, "accept");
}

async function rejectSession(id) {
    await sessionAction(id, "reject");
}

async function completeSession(id) {

    if (
        !confirm(
            "Are you sure you want to complete this session?"
        )
    ) {
        return;
    }

    await sessionAction(id, "complete");
}

async function cancelSession(id) {

    if (
        !confirm(
            "Are you sure you want to cancel this session?"
        )
    ) {
        return;
    }

    await sessionAction(id, "cancel");
}

async function sessionAction(id, action) {

    try {

        const response = await fetch(
            `${API_URL}/api/sessions/${id}/${action}`,
            {
                method: "PUT",

                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

        const data =
            await response.json();

        if (data.success) {

            alert(
                data.message ||
                "Action successful."
            );

            loadSessions();

        } else {

            alert(
                data.message ||
                "Action failed."
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Server connection failed."
        );
    }
}

// ============================================================
// START SESSION
// ============================================================

function startSession(sessionId) {

    localStorage.setItem(
        "activeSessionId",
        String(sessionId)
    );

    openSessionRoom(sessionId);
}

// ============================================================
// OPEN SESSION ROOM
// ============================================================

async function openSessionRoom(sessionId) {

    try {

        const response = await fetch(
            `${API_URL}/api/sessions/${sessionId}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.message ||
                "Unable to open session."
            );

            return;
        }

        const session =
            data.session;

        if (
            session.status !==
            "accepted"
        ) {

            alert(
                "Session is not accepted yet."
            );

            return;
        }

        if (
            session.payment_status !==
            "paid"
        ) {

            alert(
                "Please complete payment first."
            );

            return;
        }

        currentSession =
            session;

        currentSessionId =
            Number(sessionId);

        currentUser =
            getCurrentUserFromToken();

        if (
            !currentUser.name ||
            currentUser.name === "You"
        ) {

            currentUser.name =
                Number(currentUser.id) ===
                Number(session.teacher_id)

                    ? session.teacher_name

                    : session.requester_name;
        }

        // Reset chat duplicate tracking
        receivedMessageIds.clear();

        // ====================================================
        // SHOW ROOM
        // ====================================================

        const normalPage =
            document.getElementById(
                "normalSessionPage"
            );

        const room =
            document.getElementById(
                "sessionRoom"
            );

        if (normalPage) {
            normalPage.style.display =
                "none";
        }

        if (room) {
            room.classList.remove(
                "hidden"
            );
        }

        // ====================================================
        // ROOM INFO
        // ====================================================

        setText(
            "roomSkill",
            session.skill_name ||
            "Learning Session"
        );

        setText(
            "roomTeacher",
            session.teacher_name ||
            "Teacher"
        );

        setText(
            "roomLearner",
            session.requester_name ||
            "Learner"
        );

        setText(
            "teacherVideoName",
            session.teacher_name ||
            "Teacher"
        );

        setText(
            "learnerVideoName",
            session.requester_name ||
            "Learner"
        );

        const duration =
            Number(
                session.duration_minutes
            ) || 60;

        setText(
            "roomDuration",
            `${duration} minutes`
        );

        // ====================================================
        // CHAT RESET
        // ====================================================

        const chat =
            document.getElementById(
                "sessionChatMessages"
            );

        if (chat) {
            chat.innerHTML = "";
        }

        // ====================================================
        // TIMER
        // ====================================================

        startSessionTimer(duration);

        // ====================================================
        // SOCKET JOIN
        // ====================================================

        socketSessionJoined = false;

        if (socket.connected) {

            socket.emit(
                "join-session",
                {
                    sessionId:
                        currentSessionId,

                    userId:
                        currentUser.id,

                    name:
                        currentUser.name
                }
            );

        } else {

            console.log(
                "Socket not connected. Waiting for reconnect..."
            );
        }

        // ====================================================
        // START CAMERA
        // ====================================================

        await startWebRTC(session);

    } catch (error) {

        console.error(
            "Open Session:",
            error
        );

        alert(
            error.message ||
            "Unable to open session room."
        );
    }
}

// ============================================================
// HELPER
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}

// ============================================================
// IS REQUESTER / LEARNER?
// ============================================================

function isRequester() {

    if (!currentSession) {
        return false;
    }

    return Number(currentUser.id) ===
        Number(currentSession.requester_id);
}

// ============================================================
// GET LOCAL VIDEO
// ============================================================

function getLocalVideo() {

    return isRequester()

        ? document.getElementById(
            "learnerVideo"
        )

        : document.getElementById(
            "teacherVideo"
        );
}

// ============================================================
// GET REMOTE VIDEO
// ============================================================

function getRemoteVideo() {

    return isRequester()

        ? document.getElementById(
            "teacherVideo"
        )

        : document.getElementById(
            "learnerVideo"
        );
}

// ============================================================
// SHOW VIDEO
// ============================================================

function showVideo(video, stream) {

    if (!video) {
        return;
    }

    video.srcObject =
        stream;

    video.style.display =
        "block";

    video.muted =
        video === getLocalVideo();

    video.play()
        .catch(() => {});
}

// ============================================================
// HIDE PLACEHOLDER
// ============================================================

function hidePlaceholderForVideo(video) {

    if (!video) {
        return;
    }

    const placeholderId =
        video.id === "teacherVideo"
            ? "teacherVideoPlaceholder"
            : "learnerVideoPlaceholder";

    const placeholder =
        document.getElementById(
            placeholderId
        );

    if (placeholder) {
        placeholder.style.display =
            "none";
    }
}

// ============================================================
// START LOCAL MEDIA
// ============================================================

async function startLocalMedia() {

    if (localStream) {
        return localStream;
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        throw new Error(
            "Camera/microphone unavailable. Open through Chrome/Live Server."
        );
    }

    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        console.log(
            "🎥 Camera + 🎤 microphone ready"
        );

        const video =
            getLocalVideo();

        showVideo(
            video,
            localStream
        );

        hidePlaceholderForVideo(
            video
        );

        updateMediaButtons();

        return localStream;

    } catch (error) {

        console.error(
            "getUserMedia:",
            error
        );

        if (
            error.name ===
            "NotAllowedError"
        ) {

            throw new Error(
                "Camera/Microphone permission denied. Chrome-la Allow click pannu."
            );
        }

        if (
            error.name ===
            "NotFoundError"
        ) {

            throw new Error(
                "Camera or microphone device not found."
            );
        }

        throw error;
    }
}

// ============================================================
// CREATE PEER CONNECTION
// ============================================================

function createPeerConnection() {

    if (peerConnection) {
        return peerConnection;
    }

    peerConnection =
        new RTCPeerConnection(
            rtcConfig
        );

    // ========================================================
    // LOCAL TRACKS
    // ========================================================

    if (localStream) {

        localStream
            .getTracks()
            .forEach(track => {

                peerConnection.addTrack(
                    track,
                    localStream
                );
            });
    }

    // ========================================================
    // REMOTE TRACK
    // ========================================================

    peerConnection.ontrack =
        function(event) {

            console.log(
                "🎥 Remote track received"
            );

            if (!remoteStream) {
                remoteStream =
                    new MediaStream();
            }

            if (event.streams[0]) {

                event.streams[0]
                    .getTracks()
                    .forEach(track => {

                        const exists =
                            remoteStream
                                .getTracks()
                                .some(
                                    oldTrack =>
                                        oldTrack.id ===
                                        track.id
                                );

                        if (!exists) {

                            remoteStream.addTrack(
                                track
                            );
                        }
                    });

            } else {

                const exists =
                    remoteStream
                        .getTracks()
                        .some(
                            oldTrack =>
                                oldTrack.id ===
                                event.track.id
                        );

                if (!exists) {

                    remoteStream.addTrack(
                        event.track
                    );
                }
            }

            const remoteVideo =
                getRemoteVideo();

            showVideo(
                remoteVideo,
                remoteStream
            );

            hidePlaceholderForVideo(
                remoteVideo
            );
        };

    // ========================================================
    // ICE
    // ========================================================

    peerConnection.onicecandidate =
        function(event) {

            if (
                !event.candidate ||
                !currentSessionId ||
                !socket.connected
            ) {
                return;
            }

            socket.emit(
                "webrtc-ice-candidate",
                {
                    sessionId:
                        currentSessionId,

                    candidate:
                        event.candidate
                }
            );
        };

    // ========================================================
    // CONNECTION STATE
    // ========================================================

    peerConnection.onconnectionstatechange =
        function() {

            if (!peerConnection) {
                return;
            }

            console.log(
                "🌐 WebRTC:",
                peerConnection.connectionState
            );

            if (
                peerConnection.connectionState ===
                "connected"
            ) {

                console.log(
                    "✅ Camera + microphone connected!"
                );
            }

            if (
                peerConnection.connectionState ===
                "failed"
            ) {

                console.warn(
                    "⚠️ WebRTC connection failed."
                );
            }
        };

    return peerConnection;
}

// ============================================================
// START WEBRTC
// ============================================================

async function startWebRTC(session) {

    currentSession =
        session;

    await startLocalMedia();

    createPeerConnection();

    // Offer will be created after joined-session.
}

// ============================================================
// CREATE OFFER
// ============================================================

async function createOffer() {

    if (
        !peerConnection ||
        !currentSessionId ||
        !currentSession
    ) {
        return;
    }

    if (!isRequester()) {
        return;
    }

    if (!socket.connected) {
        return;
    }

    if (!socketSessionJoined) {
        console.log(
            "⏳ Waiting for Socket.IO room join..."
        );
        return;
    }

    if (isMakingOffer) {
        return;
    }

    if (
        peerConnection.signalingState !==
        "stable"
    ) {
        return;
    }

    try {

        isMakingOffer =
            true;

        const offer =
            await peerConnection
                .createOffer();

        await peerConnection
            .setLocalDescription(
                offer
            );

        socket.emit(
            "webrtc-offer",
            {
                sessionId:
                    currentSessionId,

                offer:
                    peerConnection.localDescription
            }
        );

        console.log(
            "📤 WebRTC offer sent"
        );

    } catch (error) {

        console.error(
            "Offer error:",
            error
        );

    } finally {

        isMakingOffer =
            false;
    }
}

// ============================================================
// WEBRTC OFFER RECEIVED
// ============================================================

socket.on(
    "webrtc-offer",
    async function({ offer }) {

        if (!offer) {
            return;
        }

        try {

            if (!peerConnection) {

                await startLocalMedia();

                createPeerConnection();
            }

            await peerConnection
                .setRemoteDescription(
                    new RTCSessionDescription(
                        offer
                    )
                );

            await flushIce();

            const answer =
                await peerConnection
                    .createAnswer();

            await peerConnection
                .setLocalDescription(
                    answer
                );

            socket.emit(
                "webrtc-answer",
                {
                    sessionId:
                        currentSessionId,

                    answer:
                        peerConnection
                            .localDescription
                }
            );

            console.log(
                "📤 WebRTC answer sent"
            );

        } catch (error) {

            console.error(
                "Offer handling:",
                error
            );
        }
    }
);

// ============================================================
// WEBRTC ANSWER RECEIVED
// ============================================================

socket.on(
    "webrtc-answer",
    async function({ answer }) {

        if (
            !peerConnection ||
            !answer
        ) {
            return;
        }

        try {

            await peerConnection
                .setRemoteDescription(
                    new RTCSessionDescription(
                        answer
                    )
                );

            await flushIce();

            console.log(
                "✅ WebRTC answer accepted"
            );

        } catch (error) {

            console.error(
                "Answer error:",
                error
            );
        }
    }
);

// ============================================================
// ICE RECEIVED
// ============================================================

socket.on(
    "webrtc-ice-candidate",
    async function({ candidate }) {

        if (!candidate) {
            return;
        }

        try {

            if (
                peerConnection &&
                peerConnection.remoteDescription
            ) {

                await peerConnection
                    .addIceCandidate(
                        new RTCIceCandidate(
                            candidate
                        )
                    );

            } else {

                pendingIceCandidates.push(
                    candidate
                );
            }

        } catch (error) {

            console.error(
                "ICE error:",
                error
            );
        }
    }
);

// ============================================================
// FLUSH ICE
// ============================================================

async function flushIce() {

    if (
        !peerConnection ||
        !peerConnection.remoteDescription
    ) {
        return;
    }

    while (
        pendingIceCandidates.length
    ) {

        const candidate =
            pendingIceCandidates.shift();

        try {

            await peerConnection
                .addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

        } catch (error) {

            console.error(
                "ICE queued error:",
                error
            );
        }
    }
}

// ============================================================
// PARTICIPANT JOINED
// ============================================================

socket.on(
    "user-joined",
    function({ name }) {

        console.log(
            "👤 User joined:",
            name
        );

        addSystemMessage(
            `${name} joined the session. 👋`
        );

        // Learner/requester creates offer
        if (
            currentSession &&
            isRequester()
        ) {

            setTimeout(
                function() {
                    createOffer();
                },
                500
            );
        }
    }
);

// ============================================================
// PARTICIPANT LEFT
// ============================================================

socket.on(
    "user-left",
    function() {

        addSystemMessage(
            "The other participant left the session."
        );

        const remoteVideo =
            getRemoteVideo();

        if (remoteVideo) {

            remoteVideo.srcObject =
                null;

            remoteVideo.style.display =
                "none";
        }

        const placeholderId =
            isRequester()
                ? "teacherVideoPlaceholder"
                : "learnerVideoPlaceholder";

        const placeholder =
            document.getElementById(
                placeholderId
            );

        if (placeholder) {

            placeholder.style.display =
                "flex";
        }

        remoteStream =
            null;
    }
);

// ============================================================
// MICROPHONE
// ============================================================

function toggleMicrophone() {

    if (!localStream) {

        alert(
            "Microphone is not connected."
        );

        return;
    }

    const track =
        localStream
            .getAudioTracks()[0];

    if (!track) {

        alert(
            "Microphone not found."
        );

        return;
    }

    track.enabled =
        !track.enabled;

    updateMediaButtons();
}

// ============================================================
// CAMERA
// ============================================================

function toggleCamera() {

    if (!localStream) {

        alert(
            "Camera is not connected."
        );

        return;
    }

    const track =
        localStream
            .getVideoTracks()[0];

    if (!track) {

        alert(
            "Camera not found."
        );

        return;
    }

    track.enabled =
        !track.enabled;

    updateMediaButtons();
}

// ============================================================
// UPDATE MIC/CAMERA BUTTONS
// ============================================================

function updateMediaButtons() {

    const micButton =
        document.getElementById(
            "micButton"
        );

    const cameraButton =
        document.getElementById(
            "cameraButton"
        );

    const audioTrack =
        localStream?.getAudioTracks()[0];

    const videoTrack =
        localStream?.getVideoTracks()[0];

    if (micButton && audioTrack) {

        micButton.textContent =
            audioTrack.enabled
                ? "🎤"
                : "🔇";

        micButton.dataset.muted =
            String(
                !audioTrack.enabled
            );
    }

    if (cameraButton && videoTrack) {

        cameraButton.textContent =
            videoTrack.enabled
                ? "📹"
                : "🚫";

        cameraButton.dataset.cameraOff =
            String(
                !videoTrack.enabled
            );
    }
}

// ============================================================
// SCREEN SHARE
// ============================================================

async function toggleScreenShare() {

    if (!peerConnection) {

        alert(
            "Session video is not connected yet."
        );

        return;
    }

    try {

        if (screenStream) {

            await stopScreenShare();

            return;
        }

        screenStream =
            await navigator.mediaDevices
                .getDisplayMedia({
                    video: true
                });

        const screenTrack =
            screenStream
                .getVideoTracks()[0];

        const sender =
            peerConnection
                .getSenders()
                .find(
                    s =>
                        s.track &&
                        s.track.kind ===
                        "video"
                );

        if (sender) {

            await sender.replaceTrack(
                screenTrack
            );
        }

        const localVideo =
            getLocalVideo();

        if (localVideo) {

            localVideo.srcObject =
                screenStream;
        }

        screenTrack.onended =
            function() {

                stopScreenShare();
            };

        const button =
            document.getElementById(
                "screenButton"
            );

        if (button) {

            button.textContent =
                "⏹️";
        }

    } catch (error) {

        console.error(
            "Screen share:",
            error
        );
    }
}

// ============================================================
// STOP SCREEN SHARE
// ============================================================

async function stopScreenShare() {

    if (!screenStream) {
        return;
    }

    screenStream
        .getTracks()
        .forEach(
            track =>
                track.stop()
        );

    screenStream =
        null;

    if (
        peerConnection &&
        localStream
    ) {

        const cameraTrack =
            localStream
                .getVideoTracks()[0];

        const sender =
            peerConnection
                .getSenders()
                .find(
                    s =>
                        s.track &&
                        s.track.kind ===
                        "video"
                );

        if (
            sender &&
            cameraTrack
        ) {

            await sender.replaceTrack(
                cameraTrack
            );
        }
    }

    const localVideo =
        getLocalVideo();

    if (localVideo) {

        localVideo.srcObject =
            localStream;
    }

    const button =
        document.getElementById(
            "screenButton"
        );

    if (button) {

        button.textContent =
            "🖥️";
    }
}

// ============================================================
// STOP WEBRTC
// ============================================================

function stopWebRTC() {

    console.log(
        "🛑 Stopping WebRTC"
    );

    if (screenStream) {

        screenStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        screenStream =
            null;
    }

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        localStream =
            null;
    }

    if (remoteStream) {

        remoteStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        remoteStream =
            null;
    }

    if (peerConnection) {

        peerConnection.close();

        peerConnection =
            null;
    }

    pendingIceCandidates =
        [];

    isMakingOffer =
        false;

    socketSessionJoined =
        false;

    const teacherVideo =
        document.getElementById(
            "teacherVideo"
        );

    const learnerVideo =
        document.getElementById(
            "learnerVideo"
        );

    if (teacherVideo) {

        teacherVideo.srcObject =
            null;

        teacherVideo.style.display =
            "none";
    }

    if (learnerVideo) {

        learnerVideo.srcObject =
            null;

        learnerVideo.style.display =
            "none";
    }

    const teacherPlaceholder =
        document.getElementById(
            "teacherVideoPlaceholder"
        );

    const learnerPlaceholder =
        document.getElementById(
            "learnerVideoPlaceholder"
        );

    if (teacherPlaceholder) {

        teacherPlaceholder.style.display =
            "flex";
    }

    if (learnerPlaceholder) {

        learnerPlaceholder.style.display =
            "flex";
    }
}

// ============================================================
// LIVE CHAT - RECEIVE
// ============================================================

socket.on(
    "session-message",
    function(data) {

        console.log(
            "📩 Message received:",
            data
        );

        const {
            messageId,
            senderId,
            senderName,
            message
        } = data;

        if (!message) {
            return;
        }

        // Duplicate protection
        if (
            messageId &&
            receivedMessageIds.has(messageId)
        ) {
            return;
        }

        if (messageId) {
            receivedMessageIds.add(
                messageId
            );
        }

        const own =
            currentUser.id !== null &&
            Number(senderId) ===
            Number(currentUser.id);

        addChatMessage(
            senderName ||
            "User",
            message,
            own
        );
    }
);

// ============================================================
// CHAT ERROR
// ============================================================

socket.on(
    "session-message-error",
    function(data) {

        console.error(
            "❌ Chat error:",
            data
        );

        alert(
            data?.message ||
            "Message could not be delivered."
        );
    }
);

// ============================================================
// ADD CHAT MESSAGE
// ============================================================

function addChatMessage(
    name,
    message,
    own
) {

    const container =
        document.getElementById(
            "sessionChatMessages"
        );

    if (!container) {
        return;
    }

    const div =
        document.createElement(
            "div"
        );

    div.className =
        own
            ? "chat-message learner-message"
            : "chat-message teacher-message";

    const strong =
        document.createElement(
            "strong"
        );

    strong.textContent =
        name;

    const p =
        document.createElement(
            "p"
        );

    p.textContent =
        message;

    div.appendChild(
        strong
    );

    div.appendChild(
        p
    );

    container.appendChild(
        div
    );

    container.scrollTop =
        container.scrollHeight;
}

// ============================================================
// SYSTEM MESSAGE
// ============================================================

function addSystemMessage(message) {

    addChatMessage(
        "System",
        message,
        false
    );
}

// ============================================================
// SEND CHAT MESSAGE
// ============================================================

function sendSessionMessage() {

    const input =
        document.getElementById(
            "sessionChatInput"
        );

    if (!input) {
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    if (!currentSessionId) {

        alert(
            "Session is not connected."
        );

        return;
    }

    if (!socket.connected) {

        alert(
            "Live connection lost. Please wait a moment and try again."
        );

        return;
    }

    if (!socketSessionJoined) {

        alert(
            "Session room not connected yet. Please wait 1-2 seconds and try again."
        );

        return;
    }

    currentUser =
        getCurrentUserFromToken();

    const messageId =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`;

    console.log(
        "📤 Sending message:",
        {
            sessionId:
                currentSessionId,

            messageId,

            senderId:
                currentUser.id,

            senderName:
                currentUser.name,

            message
        }
    );

    // IMPORTANT:
    // Do NOT add message locally.
    // Backend broadcasts it to both users.
    socket.emit(
        "session-message",
        {
            sessionId:
                currentSessionId,

            messageId,

            senderId:
                currentUser.id,

            senderName:
                currentUser.name ||
                "You",

            message
        },
        function(ack) {

            console.log(
                "📨 Server chat acknowledgement:",
                ack
            );

            if (
                !ack ||
                !ack.success
            ) {

                alert(
                    ack?.message ||
                    "Message was not delivered."
                );
            }
        }
    );

    input.value = "";
}

// ============================================================
// ENTER CHAT
// ============================================================

function handleChatKey(event) {

    if (
        event.key ===
        "Enter"
    ) {

        event.preventDefault();

        sendSessionMessage();
    }
}

// ============================================================
// TIMER
// ============================================================

function startSessionTimer(minutes) {

    clearInterval(
        sessionTimerInterval
    );

    let seconds =
        Number(minutes) * 60;

    const element =
        document.getElementById(
            "sessionTimer"
        );

    if (!element) {
        return;
    }

    updateTimer(
        seconds,
        element
    );

    sessionTimerInterval =
        setInterval(
            function() {

                seconds--;

                updateTimer(
                    seconds,
                    element
                );

                if (
                    seconds <= 0
                ) {

                    clearInterval(
                        sessionTimerInterval
                    );

                    alert(
                        "⏰ Session time completed."
                    );
                }

            },
            1000
        );
}

// ============================================================
// UPDATE TIMER
// ============================================================

function updateTimer(
    seconds,
    element
) {

    seconds =
        Math.max(
            0,
            seconds
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        seconds % 60;

    element.textContent =
        `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
}

// ============================================================
// LEAVE SESSION
// ============================================================

function leaveSession() {

    if (
        !confirm(
            "Are you sure you want to leave this session?"
        )
    ) {
        return;
    }

    if (currentSessionId) {

        socket.emit(
            "leave-session",
            {
                sessionId:
                    currentSessionId
            }
        );
    }

    stopWebRTC();

    clearInterval(
        sessionTimerInterval
    );

    currentSession =
        null;

    currentSessionId =
        null;

    socketSessionJoined =
        false;

    receivedMessageIds.clear();

    localStorage.removeItem(
        "activeSessionId"
    );

    const room =
        document.getElementById(
            "sessionRoom"
        );

    const normalPage =
        document.getElementById(
            "normalSessionPage"
        );

    if (room) {
        room.classList.add(
            "hidden"
        );
    }

    if (normalPage) {
        normalPage.style.display =
            "";
    }

    const mic =
        document.getElementById(
            "micButton"
        );

    const camera =
        document.getElementById(
            "cameraButton"
        );

    if (mic) {
        mic.textContent =
            "🎤";
    }

    if (camera) {
        camera.textContent =
            "📹";
    }

    loadSessions();
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================
// LOGOUT
// ============================================================

function logout() {

    if (currentSessionId) {

        socket.emit(
            "leave-session",
            {
                sessionId:
                    currentSessionId
            }
        );
    }

    stopWebRTC();

    clearInterval(
        sessionTimerInterval
    );

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "activeSessionId"
    );

    window.location.href =
        "login.html";
}

// ============================================================
// NAVIGATION
// ============================================================

function goTo(page) {

    window.location.href =
        page;
}