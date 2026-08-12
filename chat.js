const CHAT_API = "http://localhost:5000/api/chat/";
const USER_API = "http://localhost:5000/api/users/";

const token = localStorage.getItem("token");

if (!token) {

    alert("Please Login First");

    window.location.href = "login.html";

    throw new Error("Token not found");
}


// ===============================
// ELEMENTS
// ===============================

const chatPage = document.querySelector(".chat-page");

const chatList =
    document.getElementById("chatList");

const emptyChatList =
    document.getElementById("emptyChatList");

const noChatSelected =
    document.getElementById("noChatSelected");

const activeChat =
    document.getElementById("activeChat");

const receiverName =
    document.getElementById("receiverName");

const receiverStatus =
    document.getElementById("receiverStatus");

const messagesBox =
    document.getElementById("messages");

const messageInput =
    document.getElementById("message");

const chatSearch =
    document.getElementById("chatSearch");


// ===============================
// CURRENT USER
// ===============================

let myId = null;

let currentReceiverId = null;

let lastMessageSignature = "";


// ===============================
// GET JWT USER ID
// ===============================

try {

    const payload = JSON.parse(
        atob(token.split(".")[1])
    );

    myId = Number(payload.id);

} catch (error) {

    console.error(
        "Token Error:",
        error
    );

    localStorage.removeItem("token");

    window.location.href =
        "login.html";

}


// ===============================
// DASHBOARD
// ===============================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


// ===============================
// GET INITIAL RECEIVER
// ===============================

function getInitialReceiverId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const queryId =
        params.get("receiver") ||
        params.get("userId");


    if (queryId) {

        return Number(queryId);

    }


    const storedId =
        localStorage.getItem("viewUserId");


    if (storedId) {

        return Number(storedId);

    }


    return null;

}


// ===============================
// LOAD CHAT LIST
// ===============================

async function loadChatList(autoSelect = false) {

    try {

        const response =
            await fetch(
                CHAT_API + "list",
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem("token");

            alert(
                "Session expired. Please login again."
            );

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();


        console.log(
            "Chat List:",
            data
        );


        chatList.innerHTML = "";


        const initialReceiverId =
            getInitialReceiverId();


        // ==========================================
        // NO EXISTING CHATS
        // ==========================================

        if (
            !data.success ||
            !Array.isArray(data.chats) ||
            data.chats.length === 0
        ) {

            emptyChatList.style.display =
                "block";


            // IMPORTANT:
            // If user came from Find Skills
            // with a receiver ID, open that user
            // even though no previous chat exists.

            if (
                initialReceiverId &&
                initialReceiverId !== myId
            ) {

                await openNewConversation(
                    initialReceiverId
                );

            }

            return;
        }


        emptyChatList.style.display =
            "none";


        let receiverFoundInList =
            false;


        data.chats.forEach(chat => {

            const item =
                document.createElement("div");


            const chatUserId =
                Number(chat.user_id);


            item.className =
                "chat-item";


            item.dataset.userId =
                chatUserId;


            if (
                currentReceiverId &&
                chatUserId === currentReceiverId
            ) {

                item.classList.add(
                    "active"
                );

            }


            const unread =
                Number(chat.unreadCount) || 0;


            item.innerHTML = `

                <div class="chat-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>


                <div class="chat-item-content">

                    <div class="chat-item-top">

                        <span class="chat-item-name">

                            ${escapeHTML(chat.name)}

                        </span>


                        <span class="chat-item-time">

                            ${formatListTime(
                                chat.last_message_time
                            )}

                        </span>

                    </div>


                    <div class="chat-last-message">

                        ${
                            chat.last_message
                                ? escapeHTML(
                                    chat.last_message
                                  )
                                : "No messages"
                        }

                    </div>

                </div>


                ${
                    unread > 0
                        ? `
                            <span class="chat-unread">

                                ${
                                    unread > 99
                                        ? "99+"
                                        : unread
                                }

                            </span>
                        `
                        : ""
                }

            `;


            item.addEventListener(
                "click",
                () => {

                    openChat(
                        chatUserId,
                        chat.name
                    );

                }
            );


            chatList.appendChild(item);


            if (
                initialReceiverId &&
                chatUserId === initialReceiverId
            ) {

                receiverFoundInList =
                    true;

            }

        });


        // ==========================================
        // RECEIVER ALREADY HAS CHAT
        // ==========================================

        if (
            initialReceiverId &&
            receiverFoundInList &&
            initialReceiverId !== myId
        ) {

            const selectedChat =
                data.chats.find(
                    chat =>
                        Number(chat.user_id) ===
                        initialReceiverId
                );


            if (selectedChat) {

                await openChat(
                    Number(
                        selectedChat.user_id
                    ),
                    selectedChat.name
                );

            }

            return;
        }


        // ==========================================
        // RECEIVER HAS NO PREVIOUS CHAT
        // ==========================================

        if (
            initialReceiverId &&
            !receiverFoundInList &&
            initialReceiverId !== myId
        ) {

            await openNewConversation(
                initialReceiverId
            );

            return;
        }


        // ==========================================
        // NORMAL SIDEBAR CHAT OPEN
        // ==========================================

        if (
            autoSelect &&
            !initialReceiverId &&
            data.chats.length > 0
        ) {

            const first =
                data.chats[0];


            await openChat(
                Number(first.user_id),
                first.name
            );

        }


    } catch (error) {

        console.error(
            "Chat List Error:",
            error
        );

    }

}


// ===============================
// OPEN NEW CONVERSATION
// ===============================

async function openNewConversation(
    userId
) {

    currentReceiverId =
        Number(userId);


    if (!currentReceiverId) {

        return;

    }


    if (
        currentReceiverId === myId
    ) {

        alert(
            "You cannot chat with yourself."
        );

        return;

    }


    localStorage.setItem(
        "viewUserId",
        String(currentReceiverId)
    );


    // Get user name from users API

    try {

        const response =
            await fetch(
                USER_API + currentReceiverId,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        if (
            response.ok &&
            data.success &&
            data.user
        ) {

            const user =
                Array.isArray(data.user)
                    ? data.user[0]
                    : data.user;


            showActiveChat(
                currentReceiverId,
                user.name || "User"
            );


        } else {

            alert(
                "User not found."
            );

        }


    } catch (error) {

        console.error(
            "Open New Conversation Error:",
            error
        );

    }

}


// ===============================
// SHOW ACTIVE CHAT
// ===============================

function showActiveChat(
    userId,
    name
) {

    currentReceiverId =
        Number(userId);


    receiverName.innerText =
        name;


    receiverStatus.innerText =
        "SkillSync User";


    noChatSelected.classList.add(
        "hidden"
    );


    activeChat.classList.remove(
        "hidden"
    );


    chatPage.classList.add(
        "show-conversation"
    );


    // Highlight existing item if present

    document
        .querySelectorAll(".chat-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );


            if (
                Number(
                    item.dataset.userId
                ) === currentReceiverId
            ) {

                item.classList.add(
                    "active"
                );

            }

        });


    messageInput.focus();

}


// ===============================
// OPEN EXISTING CHAT
// ===============================

async function openChat(
    userId,
    name
) {

    currentReceiverId =
        Number(userId);


    if (!currentReceiverId) {

        return;

    }


    if (
        currentReceiverId === myId
    ) {

        alert(
            "You cannot chat with yourself."
        );

        return;

    }


    localStorage.setItem(
        "viewUserId",
        String(currentReceiverId)
    );


    showActiveChat(
        currentReceiverId,
        name || "User"
    );


    await loadReceiverName(
        currentReceiverId
    );


    lastMessageSignature = "";


    await loadMessages(
        currentReceiverId
    );


    // Refresh list after marking read

    await loadChatList(
        false
    );


    // Re-highlight selected chat

    const selectedItem =
        document.querySelector(
            `[data-user-id="${currentReceiverId}"]`
        );


    if (selectedItem) {

        selectedItem.classList.add(
            "active"
        );

    }

}


// ===============================
// LOAD RECEIVER NAME
// ===============================

async function loadReceiverName(
    userId
) {

    try {

        const response =
            await fetch(
                USER_API + userId,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.user
        ) {

            return;

        }


        const user =
            Array.isArray(data.user)
                ? data.user[0]
                : data.user;


        if (
            user &&
            user.name
        ) {

            receiverName.innerText =
                user.name;

        }

    } catch (error) {

        console.log(
            "Receiver Name Error:",
            error
        );

    }

}


// ===============================
// LOAD MESSAGES
// ===============================

async function loadMessages(
    receiverId
) {

    if (!receiverId) {

        return;

    }


    try {

        const response =
            await fetch(
                CHAT_API + receiverId,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(data.messages)
        ) {

            // New conversation = no messages
            messagesBox.innerHTML = "";

            lastMessageSignature = "";

            return;

        }


        const signature =
            data.messages
                .map(
                    msg =>
                        `${msg.id}-${msg.is_read}-${msg.message}`
                )
                .join("|");


        // Don't rebuild if unchanged

        if (
            signature ===
            lastMessageSignature
        ) {

            return;

        }


        lastMessageSignature =
            signature;


        messagesBox.innerHTML = "";


        data.messages.forEach(
            msg => {

                const row =
                    document.createElement(
                        "div"
                    );


                if (
                    Number(
                        msg.sender_id
                    ) === myId
                ) {

                    row.className =
                        "message-row sent";

                } else {

                    row.className =
                        "message-row received";

                }


                row.innerHTML = `

                    <div class="message-bubble">

                        <div class="message-text">

                            ${escapeHTML(
                                msg.message
                            )}

                        </div>


                        <div class="message-time">

                            ${formatMessageTime(
                                msg.sent_at
                            )}

                        </div>

                    </div>

                `;


                messagesBox.appendChild(
                    row
                );

            }
        );


        messagesBox.scrollTop =
            messagesBox.scrollHeight;


    } catch (error) {

        console.error(
            "Load Messages Error:",
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


    if (!currentReceiverId) {

        alert(
            "Please select a conversation first."
        );

        return;

    }


    if (
        currentReceiverId === myId
    ) {

        alert(
            "You cannot message yourself."
        );

        return;

    }


    try {

        const response =
            await fetch(
                CHAT_API + "send",
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
                            currentReceiverId,

                        message:
                            message

                    })

                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Unable to send message"
            );

            return;

        }


        messageInput.value =
            "";


        lastMessageSignature = "";


        await loadMessages(
            currentReceiverId
        );


        await loadChatList(
            false
        );


        messageInput.focus();


    } catch (error) {

        console.error(
            "Send Message Error:",
            error
        );

        alert(
            "Unable to send message"
        );

    }

}


// ===============================
// ENTER TO SEND
// ===============================

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ===============================
// SEARCH CHATS
// ===============================

chatSearch.addEventListener(
    "keyup",
    function() {

        const value =
            this.value
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(".chat-item")
            .forEach(item => {

                const text =
                    item.innerText
                        .toLowerCase();


                item.style.display =
                    text.includes(value)
                        ? "flex"
                        : "none";

            });

    }
);


// ===============================
// MOBILE CHAT LIST
// ===============================

function showChatList() {

    chatPage.classList.remove(
        "show-conversation"
    );

}


// ===============================
// TIME
// ===============================

function formatMessageTime(
    dateString
) {

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


function formatListTime(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(dateString);


    const now =
        new Date();


    if (
        date.toDateString() ===
        now.toDateString()
    ) {

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    return date.toLocaleDateString(
        [],
        {
            day: "2-digit",
            month: "2-digit"
        }
    );

}


// ===============================
// SECURITY
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


// ===============================
// AUTO REFRESH
// ===============================

setInterval(
    async () => {

        if (currentReceiverId) {

            await loadMessages(
                currentReceiverId
            );

        }

        // Refresh list only if needed;
        // current chat won't blink because
        // loadMessages doesn't rebuild unless
        // messages changed.

        await loadChatList(false);

    },
    3000
);


// ===============================
// INITIAL LOAD
// ===============================

loadChatList(true);