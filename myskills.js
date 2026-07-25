// ================================
// My Skills Edit JavaScript
// ================================


// Default Skills

let skills = JSON.parse(localStorage.getItem("mySkills")) || [

    {
        name: "HTML",
        percent: 90
    },

    {
        name: "CSS",
        percent: 85
    },

    {
        name: "JavaScript",
        percent: 75
    },

    {
        name: "Figma UI/UX",
        percent: 90
    }

];



// Elements

const skillList = document.getElementById("skillList");

const editBtn = document.getElementById("editBtn");

const modal = document.getElementById("editModal");

const updateBtn = document.getElementById("updateBtn");

const closeBtn = document.getElementById("closeBtn");




// Show Skills

function showSkills(){

    skillList.innerHTML = "";

    skills.forEach((skill)=>{

        skillList.innerHTML += `

        <div class="skill-card">

            <div class="skill-left">

                <div class="skill-icon">
                    <i class="fa fa-code"></i>
                </div>


                <div class="skill-info">

                    <h3>${skill.name}</h3>

                    <p>${skill.percent}%</p>

                    <div class="progress">
                        <div style="width:${skill.percent}%"></div>
                    </div>

                </div>

            </div>

        </div>

        `;

    });

}



// Edit Button

editBtn.addEventListener("click",function(){

    modal.style.display="flex";


    document.getElementById("skill1Name").value = skills[0].name;
    document.getElementById("skill1Percent").value = skills[0].percent;


    document.getElementById("skill2Name").value = skills[1].name;
    document.getElementById("skill2Percent").value = skills[1].percent;


    document.getElementById("skill3Name").value = skills[2].name;
    document.getElementById("skill3Percent").value = skills[2].percent;


    document.getElementById("skill4Name").value = skills[3].name;
    document.getElementById("skill4Percent").value = skills[3].percent;


});





// Update Button

updateBtn.addEventListener("click",function(){


    skills = [

        {
            name: document.getElementById("skill1Name").value,
            percent: document.getElementById("skill1Percent").value
        },


        {
            name: document.getElementById("skill2Name").value,
            percent: document.getElementById("skill2Percent").value
        },


        {
            name: document.getElementById("skill3Name").value,
            percent: document.getElementById("skill3Percent").value
        },


        {
            name: document.getElementById("skill4Name").value,
            percent: document.getElementById("skill4Percent").value
        }

    ];



    localStorage.setItem(
        "mySkills",
        JSON.stringify(skills)
    );


    showSkills();


    modal.style.display="none";


});





// Close

closeBtn.addEventListener("click",function(){

    modal.style.display="none";

});




// Load

showSkills();