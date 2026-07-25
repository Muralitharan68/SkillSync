const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

const inputs = document.querySelectorAll("input");
const about = document.getElementById("about");

editBtn.addEventListener("click", () => {

    inputs.forEach(input => {
        input.disabled = false;
    });

    about.disabled = false;

    saveBtn.style.display = "inline-block";

    editBtn.style.display = "none";

});

saveBtn.addEventListener("click", () => {

    inputs.forEach(input => {
        input.disabled = true;
    });

    about.disabled = true;

    document.getElementById("nameText").innerText =
        document.getElementById("name").value;

    alert("Profile Updated Successfully ✅");

    saveBtn.style.display = "none";

    editBtn.style.display = "inline-block";

});