const API = "http://localhost:5000/api/skills";

const token = localStorage.getItem("token");


// ================= LOGIN CHECK =================

if (!token) {

    alert("Please Login First");

    window.location.href = "login.html";

}


// ================= ELEMENTS =================

const skillName =
    document.getElementById("skillName");

const skillLevel =
    document.getElementById("skillLevel");

const addSkillBtn =
    document.getElementById("addSkill");

const skillTable =
    document.getElementById("skillTable");

const emptyState =
    document.getElementById("emptyState");

const skillCount =
    document.getElementById("skillCount");


// ================= NAVIGATION =================

function goTo(page) {

    window.location.href = page;

}


// ================= LOGOUT =================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("viewUserId");

    window.location.href = "login.html";

}


// ================= LOAD SKILLS =================

async function loadSkills() {

    try {

        const res = await fetch(API, {

            method: "GET",

            headers: {

                Authorization:
                    "Bearer " + token

            }

        });


        const data = await res.json();

        console.log("Skills:", data);


        skillTable.innerHTML = "";


        if (
            !data.success ||
            !data.skills ||
            data.skills.length === 0
        ) {

            emptyState.style.display = "block";

            skillCount.innerText = "0 Skills";

            return;

        }


        emptyState.style.display = "none";


        skillCount.innerText =
            data.skills.length +
            (
                data.skills.length === 1
                    ? " Skill"
                    : " Skills"
            );


        data.skills.forEach(skill => {

            const row =
                document.createElement("tr");


            const level =
                skill.skill_level || "Beginner";


            const levelClass =
                level.toLowerCase();


            row.innerHTML = `

                <td>
                    <strong>
                        ${skill.skill_name}
                    </strong>
                </td>

                <td>

                    <span class="level ${levelClass}">
                        ${level}
                    </span>

                </td>

                <td>

                    <button
                        class="edit"
                        onclick="
                            openEditModal(
                                ${skill.id},
                                '${escapeText(skill.skill_name)}',
                                '${escapeText(level)}'
                            )
                        ">

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="delete"
                        onclick="
                            deleteSkill(${skill.id})
                        ">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            `;


            skillTable.appendChild(row);

        });


    } catch (error) {

        console.log(
            "Load Skills Error:",
            error
        );

        alert(
            "Unable to connect to Backend"
        );

    }

}


// ================= ESCAPE TEXT =================

function escapeText(text) {

    return String(text)
        .replace(/'/g, "\\'");

}


// ================= ADD SKILL =================

addSkillBtn.addEventListener(
    "click",
    addSkill
);


async function addSkill() {

    const name =
        skillName.value.trim();


    const level =
        skillLevel.value;


    if (!name) {

        alert(
            "Please enter skill name"
        );

        skillName.focus();

        return;

    }


    try {

        const res = await fetch(
            API,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        "Bearer " + token

                },

                body: JSON.stringify({

                    skill_name: name,

                    skill_level: level

                })

            }
        );


        const data =
            await res.json();


        console.log(
            "Add Skill:",
            data
        );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to add skill"
            );

            return;

        }


        alert(
            "Skill Added Successfully ✅"
        );


        skillName.value = "";

        skillLevel.value =
            "Beginner";


        loadSkills();


    } catch (error) {

        console.log(
            "Add Skill Error:",
            error
        );

        alert(
            "Unable to connect to Backend"
        );

    }

}


// ================= DELETE SKILL =================

async function deleteSkill(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this skill?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const res =
            await fetch(
                API + "/" + id,
                {

                    method: "DELETE",

                    headers: {

                        Authorization:
                            "Bearer " + token

                    }

                }
            );


        const data =
            await res.json();


        console.log(
            "Delete Skill:",
            data
        );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to delete skill"
            );

            return;

        }


        alert(
            "Skill Deleted Successfully ✅"
        );


        loadSkills();


    } catch (error) {

        console.log(
            "Delete Skill Error:",
            error
        );

        alert(
            "Unable to connect to Backend"
        );

    }

}


// ================= EDIT MODAL =================

function openEditModal(
    id,
    name,
    level
) {

    document.getElementById(
        "editSkillId"
    ).value = id;


    document.getElementById(
        "editSkillName"
    ).value = name;


    document.getElementById(
        "editSkillLevel"
    ).value = level;


    document.getElementById(
        "editModal"
    ).classList.add("show");

}


// ================= CLOSE MODAL =================

function closeEditModal() {

    document.getElementById(
        "editModal"
    ).classList.remove("show");

}


// ================= UPDATE SKILL =================

async function updateSkill() {

    const id =
        document.getElementById(
            "editSkillId"
        ).value;


    const name =
        document.getElementById(
            "editSkillName"
        ).value.trim();


    const level =
        document.getElementById(
            "editSkillLevel"
        ).value;


    if (!name) {

        alert(
            "Please enter skill name"
        );

        return;

    }


    try {

        const res =
            await fetch(
                API + "/" + id,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            "Bearer " + token

                    },

                    body: JSON.stringify({

                        skill_name: name,

                        skill_level: level

                    })

                }
            );


        const data =
            await res.json();


        console.log(
            "Update Skill:",
            data
        );


        if (!data.success) {

            alert(
                data.message ||
                "Unable to update skill"
            );

            return;

        }


        alert(
            "Skill Updated Successfully ✅"
        );


        closeEditModal();

        loadSkills();


    } catch (error) {

        console.log(
            "Update Skill Error:",
            error
        );

        alert(
            "Unable to connect to Backend"
        );

    }

}


// ================= CLOSE MODAL ON OUTSIDE CLICK =================

document
    .getElementById("editModal")
    .addEventListener(
        "click",
        function(event) {

            if (
                event.target === this
            ) {

                closeEditModal();

            }

        }
    );


// ================= INITIAL LOAD =================

loadSkills();