const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const collegeInput = document.getElementById("college");
const departmentInput = document.getElementById("department");
const aboutInput = document.getElementById("about");

const token = localStorage.getItem("token");

// Profile Load
async function loadProfile() {

    try {

        const response = await fetch("http://localhost:5000/api/auth/profile", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const data = await response.json();

        if (data.success) {

            document.getElementById("nameText").innerText = data.user.name;

            nameInput.value = data.user.name;
            emailInput.value = data.user.email;
            collegeInput.value = data.user.college || "";
            departmentInput.value = data.user.department || "";
            aboutInput.value = data.user.about || "";

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

    }

}

loadProfile();


// Edit Button
editBtn.addEventListener("click", () => {

    nameInput.disabled = false;
    emailInput.disabled = false;
    collegeInput.disabled = false;
    departmentInput.disabled = false;
    aboutInput.disabled = false;

    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";

});


// Save Button
saveBtn.addEventListener("click", async () => {

    try {

        const response = await fetch("http://localhost:5000/api/auth/profile", {

            method: "PUT",

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${token}`

            },

            body: JSON.stringify({

                name: nameInput.value,
                email: emailInput.value,
                college: collegeInput.value,
                department: departmentInput.value,
                about: aboutInput.value

            })

        });

        const data = await response.json();

        if (data.success) {

            alert("Profile Updated Successfully ✅");

            nameInput.disabled = true;
            emailInput.disabled = true;
            collegeInput.disabled = true;
            departmentInput.disabled = true;
            aboutInput.disabled = true;

            editBtn.style.display = "inline-block";
            saveBtn.style.display = "none";

            loadProfile();

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

    }

});