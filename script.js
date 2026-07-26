const API = "http://localhost:5000/api/auth";

// ================= REGISTER =================

function register() {

    const user = {

        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        skills: document.getElementById("skills").value.split(",")

    };

    fetch(API + "/register", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(user)

    })

    .then(res => res.json())

    .then(data => {

        alert(data.message);

        if (data.success) {

            window.location.href = "login.html";

        }

    })

    .catch(err => {

        console.log(err);

        alert("Registration Failed");

    });

}

// ================= LOGIN =================

function login() {

    const user = {

        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value

    };

    fetch(API + "/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(user)

    })

    .then(res => res.json())

    .then(data => {

        if (data.success) {

            // JWT Token Save
            localStorage.setItem("token", data.token);

            alert("Login Successful ✅");

            window.location.href = "dashboard.html";

        } else {

            alert(data.message);

        }

    })

    .catch(err => {

        console.log(err);

        alert("Login Failed");

    });

}