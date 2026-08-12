const API = "http://localhost:5000/api/users/";

const token = localStorage.getItem("token");


// ===============================
// LOGIN CHECK
// ===============================

if (!token) {

    alert("Please Login First");

    window.location.href = "login.html";

}


// ===============================
// GET USER ID
// ===============================

const params =
    new URLSearchParams(window.location.search);

const urlUserId =
    params.get("id");


// localStorage fallback
const savedUserId =
    localStorage.getItem("viewUserId");


const userId =
    urlUserId || savedUserId;


console.log("Profile User ID:", userId);


if (!userId) {

    alert("User ID Not Found");

    window.location.href = "findskills.html";

}


// ===============================
// LOAD PROFILE
// ===============================

async function loadProfile() {

    try {

        const res = await fetch(
            API + userId,
            {
                method: "GET",

                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );


        const data =
            await res.json();


        console.log(
            "Profile Response:",
            data
        );


        // Token expired
        if (res.status === 401) {

            alert(
                "Session expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;

        }


        // User not found
        if (!res.ok || !data.success || !data.user) {

            alert(
                data.message ||
                "Unable to Load Profile"
            );

            return;

        }


        // IMPORTANT:
        // userController now returns OBJECT
        const user = data.user;


        // ===============================
        // BASIC PROFILE
        // ===============================

        document.getElementById("name").innerText =
            user.name || "Not Available";


        document.getElementById("email").innerText =
            user.email || "Not Available";


        document.getElementById("college").innerText =
            user.college || "Not Available";


        document.getElementById("department").innerText =
            user.department || "Not Available";


        document.getElementById("about").innerText =
            user.about || "No About Added";


        // ===============================
        // SKILLS
        // ===============================

        const skillsContainer =
            document.getElementById(
                "skillsContainer"
            );


        skillsContainer.innerHTML = "";


        if (
            user.skills &&
            Array.isArray(user.skills) &&
            user.skills.length > 0
        ) {

            user.skills.forEach(skill => {

                const skillCard =
                    document.createElement("div");


                skillCard.className =
                    "skill-card";


                skillCard.innerHTML = `

                    <span>
                        ${escapeHTML(skill.name)}
                    </span>

                    <span class="level">
                        ${escapeHTML(skill.level)}
                    </span>

                `;


                skillsContainer.appendChild(
                    skillCard
                );

            });

        } else {

            skillsContainer.innerHTML = `

                <p style="
                    color:#888;
                    padding:10px 0;
                ">
                    No skills added yet.
                </p>

            `;

        }


    } catch (error) {

        console.error(
            "Profile Load Error:",
            error
        );

        alert(
            "Unable to Load Profile"
        );

    }

}


// ===============================
// SECURITY
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


// ===============================
// CHAT BUTTON
// ===============================

const chatBtn =
    document.querySelector(".chat-btn");


if (chatBtn) {

    chatBtn.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "viewUserId",
                String(userId)
            );

            window.location.href =
                "chat.html";

        }
    );

}


// ===============================
// INITIAL LOAD
// ===============================

loadProfile();