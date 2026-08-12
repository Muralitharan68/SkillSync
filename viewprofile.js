const API = "http://localhost:5000/api/users/";

const token = localStorage.getItem("token");

// Login Check
if (!token) {
    alert("Please Login First");
    window.location.href = "login.html";
}

// Get User ID
const userId = localStorage.getItem("viewUserId");

console.log("User ID:", userId);

if (!userId) {
    alert("User ID Not Found");
    window.location.href = "findskills.html";
}

// Load Profile
async function loadProfile() {

    try {

        const res = await fetch(API + userId, {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();

        console.log(data);

        if (!data.success) {
            alert(data.message);
            return;
        }

        const user = data.user[0];

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

        // Skills
        const skillsContainer =
            document.getElementById("skillsContainer");

        skillsContainer.innerHTML = "";

        data.user.forEach(skill => {

            skillsContainer.innerHTML += `

                <div class="skill-card">

                    <span>${skill.skill_name}</span>

                    <span class="level">
                        ${skill.skill_level}
                    </span>

                </div>

            `;

        });

    }

    catch (err) {

        console.log(err);

        alert("Unable to Load Profile");

    }

}

// Chat Button
document.querySelector(".chat-btn").addEventListener("click", () => {

    alert("Chat Module Coming Soon");

});

// Initial Load
loadProfile();