const load = (...args) => parent.load(...args)
const save = (...args) => parent.save(...args)

window.addEventListener("storage", (event) => {
    if (event.key === "class_change_signal") {
        class_changed();
    }
});

let deletePressed = false
let altPressed = false
let f2Pressed = false
let iPressed = false

let students_dirty = false

let addtolist_mode
let homeWorkcaunt = 0
let homeWorkcauntpopulateisdone = false

let homeworkdelmodelocal  = false
let homeworkdelmodeglobal = false

let makeavaylebelforadterporsen  = false

document.addEventListener("mouseover", function (event) {
    const button = event.target.closest(".homeworks_place [homework-context]");

    if (!button) {
        return;
    }

    const rect = button.getBoundingClientRect();
    const buttonStyle = getComputedStyle(button);

    homework_tooltip.textContent = button.getAttribute("homework-context");

    // Butonun fontunu birebir tooltip'e aktar
    homework_tooltip.style.font = buttonStyle.font;
    homework_tooltip.style.letterSpacing = buttonStyle.letterSpacing;

    homework_tooltip.style.left = `${rect.left + rect.width / 2}px`;
    homework_tooltip.style.top = `${rect.top - 10}px`;

    homework_tooltip.style.visibility = "visible";
    homework_tooltip.style.opacity = "1";
});


document.addEventListener("mouseout", function (event) {
    const button = event.target.closest(".homeworks_place [homework-context]");

    if (!button) {
        return;
    }

    homework_tooltip.style.visibility = "hidden";
    homework_tooltip.style.opacity = "0";
});

function class_changed() {
    location.reload();
}
let aded_chields = new Set();

const STUDENT_TEMPLATE = {
    displayname: "",
    id: 0,

    homework: [],
    behavior: [],

    notes: "",

    extra: {},

    TEMPLATE_version:"1.0.0"
}

let selected_class = load("selected_class");



let students;
try {
    students = load(selected_class);
} catch {
    students = {};
}

// Sistem kayıtları öğrenci listelerine dahil edilmez.
function realStudentKeys() {
    return Object.keys(students).filter(key => !key.startsWith("___"));
}

function initializeCommonHomeworks() {
    if (Object.hasOwn(students, "___homeWorks___")) return;

    const keys = realStudentKeys();
    const common = [];
    const converted = {};
    let count = 0;
    for (const key of keys) count = Math.max(count, students[key].homework.length);

    // Eski kayıtları yalnız bir kez dönüştür. Kontrol tamamlanmadan değiştirme.
    for (let i = 0; i < count; i++) {
        let metadata;
        for (const key of keys) {
            const old = students[key].homework[i];
            if (old === undefined) continue;
            const {status, ...info} = old;
            if (typeof info.name !== "string") throw new Error("Eski ödevin adı bulunamadı.");
            if (metadata !== undefined) {
                const fields = new Set([...Object.keys(metadata), ...Object.keys(info)]);
                if ([...fields].some(field => JSON.stringify(metadata[field]) !== JSON.stringify(info[field]))) {
                    throw new Error(`${i + 1}. ödev öğrenciler arasında farklı; dönüşüm durduruldu.`);
                }
            } else metadata = info;
        }
        if (metadata === undefined) throw new Error("Eski ödev bilgisi eksik.");
        common.push(metadata);
    }
    for (const key of keys) {
        converted[key] = common.map((_, i) => ({status: students[key].homework[i]?.status ?? ""}));
    }
    const commonStudent = structuredClone(STUDENT_TEMPLATE);
    commonStudent.displayname = "___homeWorks___";
    commonStudent.homework = common;
    students["___homeWorks___"] = commonStudent;
    for (const key of keys) students[key].homework = converted[key];
    students_dirty = true;
}

initializeCommonHomeworks();
loodallstudents()

window.addEventListener("pagehide", () => {
    parent.window.removeEventListener("keyup", keyupHandler)
    let claslar = load("classes")

    if (students_dirty && claslar.includes(selected_class)) {
        save(selected_class, students)
    }
    
}, { once: true });

async function addFrom_button(){
    const frame = document.getElementById("inputtext")


    if (frame.value.trim() === ""){
        await window.parent.beter_alert("alert", "lütfen isim giriniz")
        keyreset()

        return
    }

    if (frame.value.trim().startsWith("___")) {
        await window.parent.beter_alert("alert", "___ ile başlayan isimler sistem için ayrılmıştır.");
        keyreset();
        return;
    }

    if (aded_chields.has(frame.value.trim())) {
        identstudent(frame.value.trim())
        return
    }
    addtolist(frame.value.trim(),frame.value.trim())
    register_student(frame.value.trim())
    finiser("wipeandredo")
}


function identstudent(value){
    document.querySelector(".ident")?.classList.remove("ident");
    let a = document.getElementById(`chield_name_${value}`)

    if (a === null) {
        return
    }

    a.classList.add("ident")
    a.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}
function register_student(text){
    const new_student = structuredClone(STUDENT_TEMPLATE);
    new_student.displayname = text;
    new_student.homework = students["___homeWorks___"].homework.map(() => ({status: ""}));
    students[text.trim()] = new_student;
    students_dirty = true;
}
function unregister_student(text){
    if (text.trim().startsWith("___")) return;

    delete students[text.trim()]

    document.getElementById(`chield_name_${text}`).remove();




    aded_chields.delete(text)

    students_dirty = true

}



function loodallstudents() {
    for (const key of realStudentKeys()) {
        const student = students[key];
        addtolist(key,student.displayname);
    }
    
}

async function random_student_btn(){
    let students_as_list = realStudentKeys().map(key => students[key]);
    let lucy_person         = random_student(students_as_list)


    if (lucy_person === undefined) {
        await window.parent.beter_alert("alert", "Seçilecek öğrenci yok")
        keyreset()
        return
    }
    
    let lucy_person_display = document.getElementById("row_in_table_in_Random_student_lucy_porsen").children[0]
    lucy_person_display.innerHTML = "Seçilen : " + lucy_person.displayname
    let lucy_person_key = realStudentKeys().find(key => students[key] === lucy_person)
    lucy_person_display.onclick = () => identstudent(lucy_person_key)

}

let internel_list_for_random_student_fn=[ ]

function random_student(studentst) {
    
    if (internel_list_for_random_student_fn.length !== studentst.length || !internel_list_for_random_student_fn.every(student => studentst.some(item => item.displayname === student.displayname))) {
        internel_list_for_random_student_fn.push(...studentst.filter(student => !internel_list_for_random_student_fn.some(item => item.displayname === student.displayname)));
        internel_list_for_random_student_fn = internel_list_for_random_student_fn.filter(student => studentst.some(item => item.displayname === student.displayname));
    }

    if (internel_list_for_random_student_fn.length === 0) {
        return
    }

    if (internel_list_for_random_student_fn.length === 1) {
        return internel_list_for_random_student_fn[0]
    }

        
    let total_normal_chance = 0;
    let normal_chances = [];

    let total_unpredictable_chance = 0;
    let unpredictable_chances = [];

    let chances = [];

    for (let i = 0; i < internel_list_for_random_student_fn.length; i++) {
        const normal_chance = 0.01 + (i / (internel_list_for_random_student_fn.length - 1));
        const unpredictable_chance = Math.random();
    
        normal_chances.push(normal_chance);
        unpredictable_chances.push(unpredictable_chance);

        total_normal_chance += normal_chance;
        total_unpredictable_chance += unpredictable_chance;
    }

    for (let i = 0; i < internel_list_for_random_student_fn.length; i++) {
        const normal_chance = (normal_chances[i] / total_normal_chance) * 0.97;
        const unpredictable_chance = (unpredictable_chances[i] / total_unpredictable_chance) * 0.03;

        chances.push(normal_chance + unpredictable_chance);
    }

    let random = Math.random();
    let selected_index = 0;

    for (let i = 0; i < chances.length; i++) {
        random -= chances[i];
    
        if (random <= 0) {
            selected_index = i;
            break;
        }
    }

    const selected_student = internel_list_for_random_student_fn[selected_index];

    internel_list_for_random_student_fn.splice(selected_index, 1);
    internel_list_for_random_student_fn.unshift(selected_student);

    
    return selected_student;
}



function addtolist(text,name){
    
    try {
        addtolist_mode = "addtolistforgenelbakıs"
        addtolistforgenelbakıs(text,name)
    }
    catch{
        try {
            addtolist_mode = "addtolistforodevler"
            addtolistforodevler(text,name)
        }
        catch{
            addtolist_mode = "addtolisttableinDavranis"
            addtolisttableinDavranis(text,name)
        }
    }
}

function addtolistforodevler(text,name){
    if (aded_chields.has(text)) {
        return
    }


    let frame = document.getElementById("table_in_odevler").children[0];
    let addhomvorkglobal = document.getElementById("add_suffer_globaly")
    let fistporsen = document.getElementById("for_first_person")
    



    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const namediv = document.createElement("div");
    const odevler = document.createElement("div");
    const spacer = document.createElement("div");

    const delbtn = document.createElement("button");
    addhomvorkglobal.setAttribute("rowspan", realStudentKeys().length + 1)

    row.id = `chield_name_${text}`
    namediv.innerHTML = name
    delbtn.innerHTML = "+"
    spacer.classList.add("spacer")
    odevler.classList.add("homeworks_place")

    cell.append(namediv)
    cell.append(odevler)
    cell.append(spacer)
    
    cell.append(delbtn)
    
    delbtn.onclick = () => add_home_suffering(text);
    row.append(cell);
    try{
        fistporsen.parentNode.id = row.id
        fistporsen.replaceWith(cell);
        
    }catch{
        frame.append(row);
    }
    
    
    aded_chields.add(text)
    
    crollrelad()
}

function addtolistforgenelbakıs(text,name){
    if (aded_chields.has(text)) {
        return
    }

    let frame
    
    frame = document.getElementById("table_in_GenelBakis").children[0];
    


    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const namediv = document.createElement("div");
    const delbtn = document.createElement("button");

    row.id = `chield_name_${text}`
    namediv.innerHTML = name

    cell.append(namediv)
    cell.append(delbtn)
    delbtn.onclick = () => unregister_student(text);
    namediv.onclick = () => modifystudents(text)
    
    row.append(cell);
    frame.append(row);
    aded_chields.add(text)
}

function addtolisttableinDavranis(text,name){
    if (aded_chields.has(text)) {
        return
    }

    let frame
    
    frame = document.getElementById("table_in_Davranis").children[0];
    


    const row = document.createElement("tr");
    const cell = document.createElement("td");

    const spacer = document.createElement("div");

    const namediv = document.createElement("div");
    const slaslar = document.createElement("div");

    const btnsdiv = document.createElement("div");

    const forgiable       = document.createElement("button");
    const unforgiable     = document.createElement("button");
    const forgiableremove = document.createElement("button");

    btnsdiv.classList.add("btnsdivforbeh")


    forgiable       .innerHTML = "/"
    unforgiable     .innerHTML = "/"
    forgiableremove .innerHTML = "sil"


    btnsdiv.append(forgiable      )
    btnsdiv.append(unforgiable    )
    btnsdiv.append(forgiableremove)
    
    forgiable      .onclick = () => add_bad_be_remoweable       (text);
    unforgiable    .onclick = () => add_bad_be_unremoweable     (text);
    forgiableremove.onclick = () => add_bad_be_remoweable_remove(text);

    slaslar.classList.add("slachlar")

    spacer.classList.add("spacer")

    const delbtn = document.createElement("button");

    row.id = `chield_name_${text}`
    namediv.innerHTML = name

    cell.append(namediv)
    cell.append(slaslar)

    cell.append(btnsdiv)
    cell.append(spacer)

    cell.append(delbtn)
    delbtn.onclick = () => unregister_student(text);
    row.append(cell);
    frame.append(row);
    aded_chields.add(text)
}

function add_bad_be_remoweable(forwho){
    if (addtolist_mode !== "addtolisttableinDavranis"){
        return
    }
    let slashlar = document.getElementById(`chield_name_${forwho}`).children[0].children[1]
    let forwholower = forwho.trim()

    students[forwholower].behavior.push({attributes: "rT"})
    let slash = document.createElement("div");
    slash.innerHTML = "/"
    slashlar.append(slash)
    slashlar.setAttribute("data-white", Number(slashlar.getAttribute("data-white") || 0) + 1);

    students_dirty = true

}
async function add_bad_be_remoweable_remove(forwho){ 
    if (addtolist_mode !== "addtolisttableinDavranis"){
        return
    }
    let slashlar = document.getElementById(`chield_name_${forwho}`).children[0].children[1]
    if (Number(slashlar.getAttribute("data-white")) === 0){
        await window.parent.beter_alert("alert", "Bu öğrencide normal / yok")
        return
    }

    let forwholower = forwho.trim()

    const i = students[forwholower].behavior.findLastIndex(
        item => item.attributes === "rT"
    );

    if (i !== -1) {
        students[forwholower].behavior.splice(i, 1);
        students_dirty = true
    }

    let elementar = Array.from(slashlar.children).filter(element => !element.classList.contains("unforgiven"))
    elementar.at(-1).remove()

    slashlar.setAttribute("data-white", Number(slashlar.getAttribute("data-white") || 0) - 1);

}

function add_bad_be_unremoweable(forwho){
    if (addtolist_mode !== "addtolisttableinDavranis"){
        return
    }
    let slashlar = document.getElementById(`chield_name_${forwho}`).children[0].children[1]
    let forwholower = forwho.trim()

    students[forwholower].behavior.push({attributes: "rF"})
    let slash = document.createElement("div");
    slash.innerHTML = "/"
    slash.classList.add("unforgiven")
    slashlar.append(slash)
    slashlar.setAttribute("data-red", Number(slashlar.getAttribute("data-red") || 0) + 1);

    students_dirty = true

}

function unforgive_bad_beheviar(){
    if (addtolist_mode !== "addtolisttableinDavranis"){
        return
    }

    for (const forwho of realStudentKeys()){
        let slashlar = document.getElementById(`chield_name_${forwho}`).children[0].children[1]



        
        let forwholower = forwho.trim()
        slashlar.setAttribute("data-red"  ,0)
        slashlar.setAttribute("data-white",0)
        for (let i in students[forwho].behavior){
            let slash = document.createElement("div");
            slash.innerHTML = "/"

            if (students[forwho].behavior[i].attributes == "rF"){
                slash.classList.add("unforgiven")
                
                let s = Number(slashlar.getAttribute("data-red"))
                
                slashlar.setAttribute("data-red",  s + 1 );

            }else{
                
                let s = Number(slashlar.getAttribute("data-white"))

                slashlar.setAttribute("data-white",  s + 1 );
                
            }
            slashlar.append(slash)
        }


        
    }


}




function populate_home_suffering(forwho,mode="normal"){


    let forwholower = forwho.trim()

    let id = `chield_name_${forwho}`

    let homeWork_place = document.getElementById(id).children[0].children[1]

    if (mode==="wipeandredo"){
        homeWork_place.replaceChildren()
    }

    const commonHomeworks = students["___homeWorks___"].homework;

    for (let i = 0; i < commonHomeworks.length; i++) {
        let temp_div = document.createElement("button");
        temp_div.innerHTML = students[forwholower].homework[i].status ?? ""
        temp_div.setAttribute("likey-be", "button");
        
        temp_div.setAttribute("homwork-index", i);
        temp_div.setAttribute("homework-context", commonHomeworks[i].name);
            
        temp_div.onclick = () => swap(temp_div,forwholower);
        homeWork_place.append(temp_div)


        if (homeWorkcauntpopulateisdone === false){
            homeWorkcaunt = homeWorkcaunt + 1
        }
    }

    if (homeWorkcauntpopulateisdone === false){
        homeWorkcauntpopulateisdone = true
    }

    crollrelad()
}
async function add_home_suffering(forwho){
    let homeworkname = await window.parent.beter_alert("prompt str", "Ödev:");
    keyreset()

    if (homeworkname === null){
        keyreset()
        return
    }
    if ((homeworkname === "") ) {
        await window.parent.beter_alert("alert", "Lütfen ödev ismni girin")
        keyreset()
        return
    }
    let forwholower
    if (forwho === null){
        forwholower = null
    }else{
        forwholower = forwho.trim()
    }
    students["___homeWorks___"].homework.push({name: homeworkname});

    for (const key of realStudentKeys()) {
        if (forwho === "___globalmode___"){
            students[key].homework.push({
                status: "−"
            })
            continue
        }

        if (key !== forwholower){
            students[key].homework.push({
                status: ""
            })
        }
        else{
            students[key].homework.push({
                status: "−"
            })
        }

            
    }
    students_dirty = true
    homeWorkcaunt = homeWorkcaunt + 1
    finiser("wipeandredo")
}

crollrelad()

function crollrelad() {
    const areas = document.querySelectorAll(".homeworks_place");

    areas.forEach(area => {
        area.onwheel = function(event) {

            if (area.scrollWidth <= area.clientWidth) return;

            event.preventDefault();

            area.scrollLeft += event.deltaY;

            areas.forEach(other_area => {
                other_area.scrollLeft = area.scrollLeft;
            });
        };
    });
}
function swap(me,hwo){
    if (homeworkdelmodelocal){
        remowe_home_suffering_local(me,hwo)
        return
    }
    if (homeworkdelmodeglobal){
        remowe_home_suffering_global(me)
        return
    }
    if (me.innerHTML === "" && makeavaylebelforadterporsen === false) {
        return
    }
    if (makeavaylebelforadterporsen === true) {
        if (me.innerHTML !== ""){
            return
        }
        me.innerHTML = "−"
    } else {
        me.innerHTML = me.innerHTML === "−" ? "Y" : me.innerHTML === "Y" ? "+" : "−"
    }
    students[hwo].homework[me.getAttribute("homwork-index")].status = me.innerHTML 
    students_dirty = true
}
async function remowe_home_suffering_local(me,hwo){
    let temp = me.innerHTML 

    me.innerHTML = "";
    
    students[hwo].homework[me.getAttribute("homwork-index")].status = me.innerHTML 
    let vipe = true
    for (const key of realStudentKeys()) {

        if(document.getElementById(`chield_name_${key}`).children[0].children[1].children[me.getAttribute("homwork-index")].innerHTML !== ""){
            vipe = false
            students_dirty = true
            return
        }
    }
    if (vipe){
        if ("no" === await remowe_home_suffering_global(me)){
            students[hwo].homework[me.getAttribute("homwork-index")].status = temp
            me.innerHTML = temp;
            return
        }
    }

    students_dirty = true
}
async function remowe_home_suffering_global(me){
    if (!await window.parent.beter_alert("confirm", "Bu işlem geri alınamaz!\nDevam etmek istediğinizden emin misiniz?")){
		
        altPressed = false
        deletePressed = false
        updateHomeworkModes()
        keyreset()
        return "no"
	}
    keyreset()
    altPressed = false
    deletePressed = false
    updateHomeworkModes()
    students["___homeWorks___"].homework.splice(Number(me.getAttribute("homwork-index")), 1);
    for (const key of realStudentKeys()) {
        document.getElementById(`chield_name_${key}`).children[0].children[1].children[me.getAttribute("homwork-index")].remove()
        students[key].homework.splice(Number(me.getAttribute("homwork-index")), 1)
    }
    students_dirty = true
    finiser("wipeandredo")
}






function updateHomeworkModes() {
    homeworkdelmodelocal = false
    homeworkdelmodeglobal = false
    makeavaylebelforadterporsen = false

    if (deletePressed && altPressed) {
        homeworkdelmodeglobal = true
    }

    else if (deletePressed) {
        homeworkdelmodelocal = true
    }

    else if (altPressed) {
        makeavaylebelforadterporsen = true
    }
}


function keyreset() {
    /* 
    return;
    homeworkdelmodelocal = false
    homeworkdelmodeglobal = false
    makeavaylebelforadterporsen = false
    deletePressed = false
    altPressed = false
    f2Pressed = false
    iPressed = false
    */
}

document.addEventListener("keydown", (event) => {

    if (event.key === "Delete" || event.key === "Backspace") {
        deletePressed = true
    }

    else if (event.key === "Alt" || event.key === "AltGraph") {
        altPressed = true
    }

    else if (event.key === "F2") {
        f2Pressed = true
    }

    else if (event.key.toLowerCase() === "i") {
        iPressed = true
    }

    updateHomeworkModes()
})


function keyupHandler(event) {

    if (event.key === "Delete" || event.key === "Backspace") {
        deletePressed = false
    }

    else if (event.key === "Alt" || event.key === "AltGraph") {
        altPressed = false
    }

    else if (event.key === "F2") {
        f2Pressed = false
    }

    else if (event.key.toLowerCase() === "i") {
        iPressed = false
    }

    updateHomeworkModes()
}


document.addEventListener("keyup", keyupHandler)
parent.window.addEventListener("keyup", keyupHandler)







const homework_tooltip = document.getElementById("homework_tooltip");



function finiser(mode = "normal"){
    if (addtolist_mode !== "addtolistforodevler"){
        return
    }
    for (const key of realStudentKeys()) {

        populate_home_suffering(key,mode)
        
    }
}
const slash_tooltip = document.createElement("div")

slash_tooltip.id = "slash_tooltip"

slash_tooltip.innerHTML = `
    <span class="slash white">/</span>
    <span class="white_value"></span>

    <span class="slash red">/</span>
    <span class="red_value"></span>
`

document.body.appendChild(slash_tooltip)


let current_slachlar = null


function positionSlashTooltip(element, mouseX){
    const rect = element.getBoundingClientRect()

    slash_tooltip.style.left = `${mouseX}px`
    slash_tooltip.style.top = `${rect.top - 8}px`
}


document.addEventListener("pointerover", event => {
    const element = event.target.closest(".slachlar")

    if (!element) return

    current_slachlar = element

    slash_tooltip.querySelector(".red_value").textContent =
        element.dataset.red

    slash_tooltip.querySelector(".white_value").textContent =
        element.dataset.white

    positionSlashTooltip(element, event.clientX)

    slash_tooltip.style.visibility = "visible"
})


document.addEventListener("pointermove", event => {
    if (!current_slachlar) return

    positionSlashTooltip(current_slachlar, event.clientX)
})


document.addEventListener("pointerout", event => {
    if (!current_slachlar) return

    if (current_slachlar.contains(event.relatedTarget)) return

    current_slachlar = null

    slash_tooltip.style.visibility = "hidden"
})


window.addEventListener("resize", () => {
    if (!current_slachlar) return

    const rect = current_slachlar.getBoundingClientRect()

    slash_tooltip.style.top = `${rect.top - 8}px`
})


async function modifystudents(key){
    if (iPressed === true){

        let input = await window.parent.beter_alert("prompt int", "Okul numarası:")
        keyreset()

        if (input === null){
            return
        }

        let number = Number(input)

        if (Number.isNaN(number)) {
            await window.parent.beter_alert("alert", "lütfen bir sayı giriniz")
            return
        }
        if (!Number.isInteger(number)) {
            await window.parent.beter_alert("alert", "Öğrenci numaraları tam sayı olmalıdır")
            return
        }
        students[key].id = input
        students_dirty = true
    }
    else if (f2Pressed === true){

        let input = await window.parent.beter_alert("prompt str", "Öğrencinin yeni adı:")
        keyreset()
        students[key].displayname = input
        students_dirty = true
        document.getElementById(`chield_name_${key}`).children[0].children[0].innerHTML = input
    }
}
if(addtolist_mode === "addtolistforodevler"){
    finiser();
}

else if(addtolist_mode === "addtolisttableinDavranis"){
    unforgive_bad_beheviar();
}
