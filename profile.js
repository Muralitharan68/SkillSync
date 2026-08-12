// ================= TOKEN CHECK =================

const token = localStorage.getItem("token");

if (!token) {

    alert("Please Login First");

    window.location.href = "login.html";

}


// ================= ELEMENTS =================

const editBtn =
    document.getElementById("editBtn");

const saveBtn =
    document.getElementById("saveBtn");

const nameInput =
    document.getElementById("name");

const emailInput =
    document.getElementById("email");

const collegeInput =
    document.getElementById("college");

const departmentInput =
    document.getElementById("department");

const aboutInput =
    document.getElementById("about");

const nameText =
    document.getElementById("nameText");

const logoutBtn =
    document.getElementById("logoutBtn");


// ================= API =================

const PROFILE_API =
    "http://localhost:5000/api/auth/profile";


// ================= LOAD PROFILE =================

async function loadProfile() {

    try {

        const response =
            await fetch(PROFILE_API, {

                method: "GET",

                headers: {

                    "Authorization":
                        "Bearer " + token

                }

            });


        // Token expired

        if (response.status === 401) {

            alert(
                "Session expired. Please login again."
            );

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();

        console.log(
            "Profile Response:",
            data
        );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to load profile"
            );

            return;

        }


        const user = data.user;


        // ================= DISPLAY DATA =================

        nameText.innerText =
            user.name || "User";


        nameInput.value =
            user.name || "";


        emailInput.value =
            user.email || "";


        collegeInput.value =
            user.college || "";


        departmentInput.value =
            user.department || "";


        aboutInput.value =
            user.about || "";


    }

    catch (error) {

        console.error(
            "Profile Load Error:",
            error
        );

        alert(
            "Unable to connect to Backend"
        );

    }

}


// ================= EDIT PROFILE =================

if (editBtn) {

    editBtn.addEventListener(
        "click",
        () => {


            nameInput.disabled = false;

            emailInput.disabled = false;

            collegeInput.disabled = false;

            departmentInput.disabled = false;

            aboutInput.disabled = false;


            editBtn.style.display =
                "none";


            saveBtn.style.display =
                "inline-block";


            nameInput.focus();

        }
    );

}


// ================= SAVE PROFILE =================

if (saveBtn) {

    saveBtn.addEventListener(
        "click",
        async () => {


            // Basic validation

            if (
                nameInput.value.trim() === ""
            ) {

                alert(
                    "Name cannot be empty"
                );

                nameInput.focus();

                return;

            }


            if (
                emailInput.value.trim() === ""
            ) {

                alert(
                    "Email cannot be empty"
                );

                emailInput.focus();

                return;

            }


            try {


                const response =
                    await fetch(
                        PROFILE_API,
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    token

                            },


                            body:
                                JSON.stringify({

                                    name:
                                        nameInput.value.trim(),

                                    email:
                                        emailInput.value.trim(),

                                    college:
                                        collegeInput.value.trim(),

                                    department:
                                        departmentInput.value.trim(),

                                    about:
                                        aboutInput.value.trim()

                                })

                        }
                    );


                // Token expired

                if (
                    response.status === 401
                ) {

                    alert(
                        "Session expired. Please login again."
                    );

                    localStorage.removeItem(
                        "token"
                    );

                    window.location.href =
                        "login.html";

                    return;

                }


                const data =
                    await response.json();


                console.log(
                    "Update Response:",
                    data
                );


                if (data.success) {


                    alert(
                        "Profile Updated Successfully ✅"
                    );


                    // Disable fields

                    nameInput.disabled = true;

                    emailInput.disabled = true;

                    collegeInput.disabled = true;

                    departmentInput.disabled = true;

                    aboutInput.disabled = true;


                    // Buttons

                    editBtn.style.display =
                        "inline-block";

                    saveBtn.style.display =
                        "none";


                    // Update heading

                    nameText.innerText =
                        nameInput.value;


                    // Reload latest data

                    await loadProfile();


                }

                else {

                    alert(
                        data.message ||
                        "Profile Update Failed"
                    );

                }


            }

            catch (error) {

                console.error(
                    "Update Profile Error:",
                    error
                );

                alert(
                    "Unable to connect to Backend"
                );

            }

        }
    );

}


// ================= LOGOUT =================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {


            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "viewUserId"
            );


            window.location.href =
                "login.html";

        }
    );

}


// ================= INITIAL LOAD =================

loadProfile();