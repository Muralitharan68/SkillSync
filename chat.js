const API = "http://localhost:5000/api/chat/";
const USER_API = "http://localhost:5000/api/users/";

const token = localStorage.getItem("token");

if (!token) {
    alert("Please Login First");
    window.location.href = "login.html";
    throw new Error("Token not found");
}


// ===============================
// RECEIVER ID
// ===============================

const receiverId = Number(
    localStorage.getItem("viewUserId")
);

if (!receiverId || isNaN(receiverId)) {

    alert("Receiver User ID Not Found");

    window.location.href = "findskills.html";

    throw new Error("Invalid Receiver ID");
}


// ===============================
// ELEMENTS
// ===============================

const messagesBox =
    document.getElementById("messages");

const messageInput =
    document.getElementById("message");

const receiverName =
    document.getElementById("receiverName");


// ===============================
// GET MY USER ID
// ===============================

let myId;

try {

    const payload = JSON.parse(
        atob(token.split(".")[1])
    );

    myId = Number(payload.id);

    console.log("My ID:", myId);
    console.log("Receiver ID:", receiverId);

} catch (error) {

    console.log("Token Error:", error);

    localStorage.removeItem("token");

    alert("Login session expired");

    window.location.href = "login.html";

}


// ===============================
// LOAD RECEIVER
// ===============================

async function loadReceiver() {

    try {

        const res = await fetch(
            USER_API + receiverId,
            {
                method: "GET",

                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );


        const data = await res.json();

        console.log("Receiver API Response:", data);


        if (!res.ok) {

            receiverName.innerText =
                "Unknown User";

            console.log(
                "Receiver API Error:",
                data
            );

            return;

        }


        let user = null;


        // ===============================
        // HANDLE DIFFERENT RESPONSE TYPES
        // ===============================

        if (Array.isArray(data.user)) {

            user = data.user[0];

        } else if (
            data.user &&
            typeof data.user === "object"
        ) {

            user = data.user;

        }


        // ===============================
        // USER FOUND
        // ===============================

        if (user) {

            receiverName.innerText =
                user.name || "Unknown User";

            console.log(
                "Receiver Found:",
                user
            );

        } else {

            receiverName.innerText =
                "Unknown User";

            console.log(
                "User not found in response"
            );

        }


    } catch (error) {

        console.log(
            "Receiver Error:",
            error
        );

        receiverName.innerText =
            "Unknown User";

    }

}


// ===============================
// LOAD MESSAGES
// ===============================

async function loadMessages() {

    try {

        const res = await fetch(
            API + receiverId,
            {
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );


        const data =
            await res.json();


        console.log(
            "Messages Response:",
            data
        );


        messagesBox.innerHTML = "";


        if (
            !data.success ||
            !Array.isArray(data.messages)
        ) {

            return;

        }


        data.messages.forEach(msg => {

            const row =
                document.createElement("div");


            // My message → RIGHT

            if (
                Number(msg.sender_id) === myId
            ) {

                row.className =
                    "message-row sent";

            }

            // Other message → LEFT

            else {

                row.className =
                    "message-row received";

            }


            row.innerHTML = `

                <div class="message-bubble">

                    <div class="message-text">
                        ${escapeHTML(msg.message)}
                    </div>

                    <div class="message-time">
                        ${formatTime(msg.sent_at)}
                    </div>

                </div>

            `;


            messagesBox.appendChild(row);

        });


        messagesBox.scrollTop =
            messagesBox.scrollHeight;


    } catch (error) {

        console.log(
            "Message Load Error:",
            error
        );

    }

}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    if (receiverId === myId) {

        alert(
            "You cannot send message to yourself."
        );

        return;

    }


    try {

        const res = await fetch(
            API + "send",
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        "Bearer " + token

                },

                body: JSON.stringify({

                    receiver_id:
                        receiverId,

                    message:
                        message

                })

            }
        );


        const data =
            await res.json();


        console.log(
            "Send Response:",
            data
        );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to send message"
            );

            return;

        }


        messageInput.value = "";


        await loadMessages();


    } catch (error) {

        console.log(
            "Send Error:",
            error
        );

        alert(
            "Unable to Send Message"
        );

    }

}


// ===============================
// FORMAT TIME
// ===============================

function formatTime(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ===============================
// SECURITY
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


// ===============================
// ENTER KEY
// ===============================

messageInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ===============================
// INITIAL LOAD
// ===============================

loadReceiver();

loadMessages();


// Refresh messages

setInterval(
    loadMessages,
    2000
);