// ================================
// TOKEN CHECK
// ================================

const token = localStorage.getItem("token");

if (!token) {

    alert("Please Login First");

    window.location.href = "login.html";

    throw new Error("Token not found");
}


// ================================
// PAGE NAVIGATION
// ================================

function goTo(page) {

    window.location.href = page;

}


// ================================
// OPEN CHAT
// ================================

function openChat(userId) {

    localStorage.setItem(
        "viewUserId",
        String(userId)
    );

    window.location.href =
        "chat.html";

}


// ================================
// LOGOUT
// ================================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("viewUserId");

    localStorage.removeItem("receiverName");

    window.location.href =
        "login.html";

}


// ================================
// LOAD USER PROFILE
// ================================

async function loadUserProfile() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/profile",
            {
                method: "GET",

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
            "Profile Data:",
            data
        );


        if (
            data.success &&
            data.user
        ) {

            const username =
                document.getElementById(
                    "topUsername"
                );

            if (username) {

                username.innerText =
                    data.user.name ||
                    "User";

            }


            const profileImage =
                document.getElementById(
                    "topProfileImage"
                );


            if (
                profileImage &&
                data.user.profile_image
            ) {

                profileImage.src =
                    "http://localhost:5000/uploads/" +
                    data.user.profile_image;

            }

        }

    }
    catch (error) {

        console.error(
            "Profile Load Error:",
            error
        );

    }

}


// ================================
// UNREAD MESSAGE COUNT
// ================================

async function loadUnreadCount() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/chat/unread/count",
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );


        if (response.status === 401) {

            console.log(
                "Token expired while loading unread count"
            );

            return;

        }


        const data =
            await response.json();


        console.log(
            "Unread Count:",
            data
        );


        const badge =
            document.getElementById(
                "unreadBadge"
            );


        if (!badge) {
            return;
        }


        const count =
            Number(data.unreadCount) || 0;


        if (
            data.success &&
            count > 0
        ) {

            badge.innerText =
                count > 99
                    ? "99+"
                    : count;


            badge.classList.add(
                "show"
            );

        }
        else {

            badge.innerText = "";

            badge.classList.remove(
                "show"
            );

        }

    }
    catch (error) {

        console.error(
            "Unread Count Error:",
            error
        );

    }

}


// ================================
// TOP PROFILE CLICK
// ================================

const topProfile =
    document.querySelector(".profile");


if (topProfile) {

    topProfile.addEventListener(
        "click",
        function () {

            goTo("profile.html");

        }
    );

}


// ================================
// SEARCH
// ================================

const searchBox =
    document.querySelector(
        ".topbar input"
    );


if (searchBox) {

    searchBox.addEventListener(
        "keyup",
        function () {

            const value =
                this.value
                    .toLowerCase()
                    .trim();


            const users =
                document.querySelectorAll(
                    ".user"
                );


            users.forEach(user => {

                const text =
                    user.innerText
                        .toLowerCase();


                if (
                    text.includes(value)
                ) {

                    user.style.display =
                        "block";

                }
                else {

                    user.style.display =
                        "none";

                }

            });

        }
    );

}


// ================================
// INITIAL LOAD
// ================================

loadUserProfile();

loadUnreadCount();


// Check unread count every 5 seconds
setInterval(
    loadUnreadCount,
    5000
);