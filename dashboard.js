const token = localStorage.getItem("token");

if (!token) {
    alert("Please Login First");
    window.location.href = "login.html";
}

// Welcome Message
document.addEventListener("DOMContentLoaded", () => {

    const username = localStorage.getItem("username") || "Murali";

    const name = document.querySelector(".profile h4");
    if (name) {
        name.innerText = username;
    }

    console.log("Dashboard Loaded Successfully");

});

// Search Function
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

// Chat Button
const buttons = document.querySelectorAll(".user button");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        alert("Chat feature will be available soon!");

    });

});

// Sidebar Active Effect
const menu = document.querySelectorAll(".sidebar li");

menu.forEach(item => {

    item.addEventListener("click", () => {

        menu.forEach(i => i.classList.remove("active"));

        item.classList.add("active");

    });

});

// Logout
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

// Notification Counter
const notifications = [
    "Rahul accepted your session request.",
    "Priya sent you a message.",
    "You received a new review."
];

console.log("Notifications:", notifications);

// Future Features
// Dashboard Statistics
// Real-time Chat
// AI Skill Matching
// Session Booking
// Calendar Integration
// Notifications API