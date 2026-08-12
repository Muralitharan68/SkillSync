const API = "http://localhost:5000/api/findskills";

const token = localStorage.getItem("token");

// ================= LOGIN CHECK =================

if (!token) {
    alert("Please Login First");
    window.location.href = "login.html";
}


// ================= ELEMENTS =================

const userContainer =
    document.getElementById("userContainer");

const emptyState =
    document.getElementById("emptyState");

const search =
    document.getElementById("search");


// ================= LOAD USERS =================

async function loadUsers() {

    try {

        const res = await fetch(API, {

            headers: {
                Authorization: "Bearer " + token
            }

        });


        // Token expired

        if (res.status === 401) {

            alert("Session expired. Please login again.");

            localStorage.removeItem("token");

            window.location.href = "login.html";

            return;
        }


        const data = await res.json();

        console.log("Find Skills Response:", data);


        userContainer.innerHTML = "";


        if (
            !data.success ||
            !data.users ||
            data.users.length === 0
        ) {

            emptyState.style.display = "block";

            return;
        }


        emptyState.style.display = "none";


        // ================= GROUP USERS =================

        const groupedUsers = {};


        data.users.forEach(user => {

            if (!groupedUsers[user.id]) {

                groupedUsers[user.id] = {

                    id: Number(user.id),

                    name: user.name,

                    email: user.email,

                    college: user.college,

                    department: user.department,

                    skills: []

                };

            }


            if (user.skill_name) {

                groupedUsers[user.id].skills.push({

                    name: user.skill_name,

                    level:
                        user.skill_level || "Beginner"

                });

            }

        });


        // ================= CREATE CARDS =================

        Object.values(groupedUsers).forEach(user => {


            let skillsHTML = "";


            user.skills.forEach(skill => {

                const levelClass =
                    skill.level
                        .toLowerCase()
                        .replace(/\s+/g, "");


                skillsHTML += `

                    <div class="skill">

                        <span class="skill-name">
                            ${skill.name}
                        </span>

                        <span class="level ${levelClass}">
                            ${skill.level}
                        </span>

                    </div>

                `;

            });


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


            // ================= CARD =================

            const card =
                document.createElement("div");


            card.className = "user-card";


            card.innerHTML = `

                <div class="avatar">

                    <i class="fa-solid fa-user"></i>

                </div>


                <h3>
                    ${user.name}
                </h3>


                <div class="info">

                    <i class="fa-solid fa-envelope"></i>

                    <span>
                        ${user.email}
                    </span>

                </div>


                <div class="info">

                    <i class="fa-solid fa-building-columns"></i>

                    <span>
                        ${user.college || "Not Available"}
                    </span>

                </div>


                <div class="info">

                    <i class="fa-solid fa-graduation-cap"></i>

                    <span>
                        ${user.department || "Not Available"}
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
                        onclick="viewProfile(${user.id})">

                        <i class="fa-solid fa-user"></i>

                        View Profile

                    </button>


                    <button
                        class="chat-btn"
                        onclick="startChat(${user.id}, '${encodeURIComponent(user.name)}')">

                        <i class="fa-solid fa-comments"></i>

                        Chat

                    </button>

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


// ================= SEARCH =================

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
                    card.innerText.toLowerCase();


                if (text.includes(value)) {

                    card.style.display = "block";

                    visibleCount++;

                }

                else {

                    card.style.display = "none";

                }

            });


            if (visibleCount === 0) {

                emptyState.style.display = "block";

            }

            else {

                emptyState.style.display = "none";

            }

        }
    );

}


// ================= VIEW PROFILE =================

function viewProfile(id) {

    console.log(
        "Opening profile:",
        id
    );


    // Save receiver/profile ID

    localStorage.setItem(
        "viewUserId",
        String(id)
    );


    // Also send ID through URL

    window.location.href =
        "viewprofile.html?id=" + id;

}


// ================= START CHAT =================

function startChat(id, name) {

    console.log(
        "Opening chat with:",
        id,
        name
    );


    // IMPORTANT
    // Save receiver ID in localStorage

    localStorage.setItem(
        "viewUserId",
        String(id)
    );


    // Save receiver name too

    localStorage.setItem(
        "receiverName",
        decodeURIComponent(name)
    );


    console.log(
        "Saved Receiver ID:",
        localStorage.getItem("viewUserId")
    );


    // Open chat

    window.location.href =
        "chat.html";

}


// ================= LOGOUT =================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem("token");

            localStorage.removeItem("viewUserId");

            localStorage.removeItem("receiverName");

            window.location.href =
                "login.html";

        }
    );

}


// ================= INITIAL LOAD =================

loadUsers();