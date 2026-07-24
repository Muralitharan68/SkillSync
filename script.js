const API = "http://localhost:5000/api/auth";
function register() {

    let user = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        skills: document.getElementById("skills").value.split(",")
    };

    fetch("http://127.0.0.1:5000/api/auth/register", {
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
    .catch(error => {
        console.error(error);
        alert("Fetch Error");
    });

}
function login(){

let user={

email:
document.getElementById("loginEmail").value,
password:
document.getElementById("loginPassword").value

};

fetch(API+"/login",{
method:"POST",
headers:{"Content-Type":"application/json"

},

body:JSON.stringify(user)

})
.then(res => res.json())
.then(data => {

    alert(data.message);

    if(data.success){

        localStorage.setItem("token", data.token);

        // Temporary username save
        localStorage.setItem("username", user.email);

        window.location = "dashboard.html";

    }

});

}