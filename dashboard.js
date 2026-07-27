const token = localStorage.getItem("token");

if (!token) {
    alert("Please Login First");
    window.location.href = "login.html";
}

// ==========================
// Load User Profile
// ==========================
fetch("http://localhost:5000/api/auth/profile", {
    method: "GET",
    headers: {
        Authorization: "Bearer " + token
    }
})
.then(res => res.json())
.then(data => {

    if (data.success) {

        // Username
        document.getElementById("topUsername").innerText = data.user.name;

        // Profile Image
        if (data.user.profile_image) {

            document.getElementById("topProfileImage").src =
                "http://localhost:5000/uploads/" + data.user.profile_image;

        }

    } else {

        alert(data.message);

    }

})
.catch(err => {

    console.log(err);

});

// ==========================
// Search Users
// ==========================

const searchBox = document.querySelector(".topbar input");

if (searchBox) {

    searchBox.addEventListener("keyup", function () {

        const value = this.value.toLowerCase();

        const users = document.querySelectorAll(".user");

        users.forEach(user => {

            const text = user.innerText.toLowerCase();

            if (text.includes(value)) {

                user.style.display = "block";

            } else {

                user.style.display = "none";

            }

        });

    });

}

// ==========================
// Chat Button
// ==========================

const buttons = document.querySelectorAll(".user button");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        alert("Chat feature will be available soon!");

    });

});

// ==========================
// Sidebar Active Effect
// ==========================

const menu = document.querySelectorAll(".sidebar li");

menu.forEach(item => {

    item.addEventListener("click", () => {

        menu.forEach(i => i.classList.remove("active"));

        item.classList.add("active");

    });

});

// ==========================
// Logout
// ==========================

const logout = document.querySelector(".sidebar li:last-child");

if (logout) {

    logout.addEventListener("click", () => {

        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {

            localStorage.removeItem("token");
            localStorage.removeItem("username");

            window.location.href = "login.html";

        }

    });

}

// ==========================
// Notifications
// ==========================

const notifications = [
    "Rahul accepted your session request.",
    "Priya sent you a message.",
    "You received a new review."
];

console.log("Notifications:", notifications);