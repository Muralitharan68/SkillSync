const API = "http://localhost:5000/api/findskills";

const SESSION_API = "http://localhost:5000/api/sessions/create";

const token = localStorage.getItem("token");


// =====================================================
// LOGIN CHECK
// =====================================================

if (!token) {

    alert("Please Login First");

    window.location.href = "login.html";

}


// =====================================================
// ELEMENTS
// =====================================================

const userContainer =
    document.getElementById("userContainer");

const emptyState =
    document.getElementById("emptyState");

const search =
    document.getElementById("search");


// =====================================================
// GET CURRENT USER ID FROM JWT
// =====================================================

function getCurrentUserId() {

    try {

        const payload =
            JSON.parse(
                atob(
                    token.split(".")[1]
                )
            );

        return Number(
            payload.id ||
            payload.userId ||
            payload.user_id
        );

    }

    catch (error) {

        console.error(
            "JWT Decode Error:",
            error
        );

        return null;

    }

}


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {

    try {

        const res = await fetch(API, {

            headers: {

                Authorization:
                    "Bearer " + token

            }

        });


        // =================================================
        // TOKEN EXPIRED
        // =================================================

        if (res.status === 401) {

            alert(
                "Session expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await res.json();


        console.log(
            "Find Skills Response:",
            data
        );


        userContainer.innerHTML = "";


        // =================================================
        // NO USERS
        // =================================================

        if (
            !data.success ||
            !data.users ||
            data.users.length === 0
        ) {

            emptyState.style.display =
                "block";

            return;

        }


        emptyState.style.display =
            "none";


        // =================================================
        // GROUP USERS
        // =================================================

        const groupedUsers = {};


        data.users.forEach(user => {

            if (!groupedUsers[user.id]) {

                groupedUsers[user.id] = {

                    id: Number(user.id),

                    name: user.name,

                    email: user.email,

                    college: user.college,

                    department:
                        user.department,

                    skills: []

                };

            }


            if (user.skill_name) {

                groupedUsers[user.id]
                    .skills
                    .push({

                        name:
                            user.skill_name,

                        level:
                            user.skill_level ||
                            "Beginner"

                    });

            }

        });


        // =================================================
        // CURRENT USER
        // =================================================

        const currentUserId =
            getCurrentUserId();


        // =================================================
        // CREATE CARDS
        // =================================================

        Object.values(groupedUsers)
            .forEach(user => {


                let skillsHTML = "";


                // =================================================
                // SKILLS
                // =================================================

                user.skills.forEach(skill => {

                    const levelClass =
                        skill.level
                            .toLowerCase()
                            .replace(/\s+/g, "");


                    skillsHTML += `

                        <div class="skill">

                            <span class="skill-name">
                                ${escapeHTML(
                                    skill.name
                                )}
                            </span>

                            <span
                                class="level ${levelClass}">
                                ${escapeHTML(
                                    skill.level
                                )}
                            </span>

                        </div>

                    `;

                });


                // =================================================
                // NO SKILLS
                // =================================================

                if (!skillsHTML) {

                    skillsHTML = `

                        <p style="
                            color:#888;
                            font-size:13px;
                        ">

                            No skills added

                        </p>

                    `;

                }


                // =================================================
                // CARD
                // =================================================

                const card =
                    document.createElement("div");


                card.className =
                    "user-card";


                // =================================================
                // REQUEST BUTTON
                // =================================================

                let requestButtonHTML = "";


                // Don't show request button for yourself

                if (
                    currentUserId &&
                    Number(currentUserId) !==
                    Number(user.id)
                ) {

                    requestButtonHTML = `

                        <button
                            class="session-btn"
                            onclick="requestSession(
                                ${user.id},
                                '${encodeURIComponent(
                                    user.name
                                )}'
                            )">

                            <i class="fa-solid fa-calendar-plus"></i>

                            Request Session

                        </button>

                    `;

                }


                // =================================================
                // CARD HTML
                // =================================================

                card.innerHTML = `

                    <div class="avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>


                    <h3>
                        ${escapeHTML(
                            user.name
                        )}
                    </h3>


                    <div class="info">

                        <i class="fa-solid fa-envelope"></i>

                        <span>
                            ${escapeHTML(
                                user.email
                            )}
                        </span>

                    </div>


                    <div class="info">

                        <i class="fa-solid fa-building-columns"></i>

                        <span>
                            ${escapeHTML(
                                user.college ||
                                "Not Available"
                            )}
                        </span>

                    </div>


                    <div class="info">

                        <i class="fa-solid fa-graduation-cap"></i>

                        <span>
                            ${escapeHTML(
                                user.department ||
                                "Not Available"
                            )}
                        </span>

                    </div>


                    <hr>


                    <h4>
                        Skills
                    </h4>


                    ${skillsHTML}


                    <div class="actions">


                        <button
                            class="view-btn"
                            onclick="viewProfile(
                                ${user.id}
                            )">

                            <i class="fa-solid fa-user"></i>

                            View Profile

                        </button>


                        <button
                            class="chat-btn"
                            onclick="startChat(
                                ${user.id},
                                '${encodeURIComponent(
                                    user.name
                                )}'
                            )">

                            <i class="fa-solid fa-comments"></i>

                            Chat

                        </button>


                        ${requestButtonHTML}


                    </div>

                `;


                userContainer.appendChild(card);


            });

    }


    catch (error) {

        console.error(
            "Find Skills Error:",
            error
        );

        alert(
            "Unable to connect Backend"
        );

    }

}


// =====================================================
// REQUEST SESSION
// =====================================================

async function requestSession(
    teacherId,
    encodedTeacherName
) {

    const teacherName =
        decodeURIComponent(
            encodedTeacherName
        );


    console.log(
        "Requesting session with:",
        teacherId,
        teacherName
    );


    // =================================================
    // GET AVAILABLE SKILLS
    // =================================================

    const teacherCard =
        [...document.querySelectorAll(".user-card")]
            .find(card =>
                card.querySelector("h3")?.innerText.trim()
                === teacherName
            );


    if (!teacherCard) {

        alert(
            "Teacher information not found."
        );

        return;

    }


    const skillElements =
        teacherCard.querySelectorAll(
            ".skill-name"
        );


    const skills = [];


    skillElements.forEach(element => {

        const skill =
            element.innerText.trim();

        if (skill) {

            skills.push(skill);

        }

    });


    if (skills.length === 0) {

        alert(
            "This teacher has no skills available."
        );

        return;

    }


    // =================================================
    // SELECT SKILL
    // =================================================

    let skillName;


    if (skills.length === 1) {

        skillName = skills[0];

    }

    else {

        const skillList =
            skills
                .map(
                    (skill, index) =>
                        `${index + 1}. ${skill}`
                )
                .join("\n");


        const choice =
            prompt(
                `Which skill do you want to learn from ${teacherName}?\n\n${skillList}\n\nEnter number:`
            );


        if (choice === null) {

            return;

        }


        const selectedIndex =
            Number(choice) - 1;


        if (
            Number.isNaN(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= skills.length
        ) {

            alert(
                "Invalid skill selection."
            );

            return;

        }


        skillName =
            skills[selectedIndex];

    }


    // =================================================
    // DATE
    // =================================================

    const today =
        new Date();


    const defaultDate =
        today
            .toISOString()
            .split("T")[0];


    const sessionDate =
        prompt(
            "Enter session date (YYYY-MM-DD):",
            defaultDate
        );


    if (!sessionDate) {

        return;

    }


    // =================================================
    // DATE VALIDATION
    // =================================================

    const dateRegex =
        /^\d{4}-\d{2}-\d{2}$/;


    if (!dateRegex.test(sessionDate)) {

        alert(
            "Please enter date like 2026-09-30"
        );

        return;

    }


    // =================================================
    // TIME
    // =================================================

    const sessionTime =
        prompt(
            "Enter session time (HH:MM):",
            "19:00"
        );


    if (!sessionTime) {

        return;

    }


    const timeRegex =
        /^([01]\d|2[0-3]):([0-5]\d)$/;


    if (!timeRegex.test(sessionTime)) {

        alert(
            "Please enter time like 19:00"
        );

        return;

    }


    // =================================================
    // DURATION
    // =================================================

    const durationInput =
        prompt(
            "Enter duration in minutes:",
            "60"
        );


    if (!durationInput) {

        return;

    }


    const duration =
        Number(durationInput);


    if (
        Number.isNaN(duration) ||
        duration <= 0
    ) {

        alert(
            "Invalid duration."
        );

        return;

    }


    // =================================================
    // MESSAGE
    // =================================================

    const message =
        prompt(
            "Enter a message for the teacher:",
            `I want to learn ${skillName}`
        );


    if (message === null) {

        return;

    }


    // =================================================
    // SESSION AMOUNT
    // =================================================

    const amount =
        299;


    // =================================================
    // CONFIRM
    // =================================================

    const confirmation = confirm(

        `Create Session Request?\n\n` +

        `Teacher: ${teacherName}\n` +

        `Skill: ${skillName}\n` +

        `Date: ${sessionDate}\n` +

        `Time: ${sessionTime}\n` +

        `Duration: ${duration} minutes\n` +

        `Amount: ₹${amount}\n\n` +

        `Click OK to send request.`

    );


    if (!confirmation) {

        return;

    }


    // =================================================
    // SEND REQUEST
    // =================================================

    try {

        console.log(
            "Sending session request..."
        );


        const res =
            await fetch(
                SESSION_API,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token

                    },

                    body:
                        JSON.stringify({

                            teacher_id:
                                Number(teacherId),

                            skill_name:
                                skillName,

                            session_date:
                                sessionDate,

                            session_time:
                                sessionTime,

                            duration_minutes:
                                duration,

                            amount:
                                amount,

                            message:
                                message.trim()

                        })

                }
            );


        const data =
            await res.json();


        console.log(
            "Create Session Response:",
            data
        );


        // =================================================
        // SUCCESS
        // =================================================

        if (res.ok && data.success) {

            alert(
                "✅ Session request sent successfully!\n\n" +
                `Teacher: ${teacherName}\n` +
                `Skill: ${skillName}\n` +
                `Status: Pending`
            );


            // Open sessions page

            window.location.href =
                "sessions.html";


            return;

        }


        // =================================================
        // DUPLICATE
        // =================================================

        if (res.status === 409) {

            alert(
                "⚠️ A session already exists for this teacher, date and time."
            );

            return;

        }


        // =================================================
        // OTHER ERROR
        // =================================================

        alert(

            "❌ Session request failed.\n\n" +

            (
                data.message ||
                "Unknown error"
            )

        );

    }


    catch (error) {

        console.error(
            "Request Session Error:",
            error
        );


        alert(
            "❌ Unable to connect to backend."
        );

    }

}


// =====================================================
// SEARCH
// =====================================================

if (search) {

    search.addEventListener(
        "keyup",
        function () {

            const value =
                search.value
                    .toLowerCase()
                    .trim();


            const cards =
                document.querySelectorAll(
                    ".user-card"
                );


            let visibleCount = 0;


            cards.forEach(card => {

                const text =
                    card.innerText
                        .toLowerCase();


                if (
                    text.includes(value)
                ) {

                    card.style.display =
                        "block";

                    visibleCount++;

                }

                else {

                    card.style.display =
                        "none";

                }

            });


            if (
                visibleCount === 0
            ) {

                emptyState.style.display =
                    "block";

            }

            else {

                emptyState.style.display =
                    "none";

            }

        }
    );

}


// =====================================================
// VIEW PROFILE
// =====================================================

function viewProfile(id) {

    console.log(
        "Opening profile:",
        id
    );


    localStorage.setItem(
        "viewUserId",
        String(id)
    );


    window.location.href =
        "viewprofile.html?id=" + id;

}


// =====================================================
// START CHAT
// =====================================================

function startChat(id, name) {

    console.log(
        "Opening chat with:",
        id,
        name
    );


    localStorage.setItem(
        "viewUserId",
        String(id)
    );


    localStorage.setItem(
        "receiverName",
        decodeURIComponent(name)
    );


    console.log(
        "Saved Receiver ID:",
        localStorage.getItem(
            "viewUserId"
        )
    );


    window.location.href =
        "chat.html";

}


// =====================================================
// HTML ESCAPE
// =====================================================

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


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "viewUserId"
            );

            localStorage.removeItem(
                "receiverName"
            );

            window.location.href =
                "login.html";

        }
    );

}


// =====================================================
// INITIAL LOAD
// =====================================================

loadUsers();