const load = (...args) => parent.load(...args)
const save = (...args) => parent.save(...args)

let setrings;
try {
    setrings = load("setrings");
} catch {
    setrings = {};
}


document.querySelectorAll('[likey-be="select"]').forEach(select => {
    const setring_name = select.getAttribute("setring-name");

    if (setring_name !== null) {
        reloadValue(select,setring_name)

        select.addEventListener("change", () => {
            savevalue(select,setring_name)
        });
    }

    select.addEventListener("wheel", (event) => {
        event.preventDefault();

        let option_index = select.selectedIndex;

        if (event.deltaY > 0) {
            option_index++
        } else {
            option_index--
        }

        option_index = Math.max(0,Math.min(option_index,select.options.length - 1));

        if (option_index === select.selectedIndex) {
            return
        }

        select.selectedIndex = option_index;
        select.dispatchEvent(new Event("change",{bubbles:true}));
        
    },{passive:false});
});



function comit_new_setrings(){
    save("settings_change_signal",Date.now());
    parent.settings_changed();
}



function savevalue(me,place){
    setrings[place] = me.value

    save("setrings",setrings);
    comit_new_setrings()
}

function reloadValue(me,place){
    let setringslocal = load("setrings")
    if (setringslocal[place] !== undefined) {
        me.value = setringslocal[place];
    }
}


async function delAllBtn(){
    if (!await parent.beter_alert(
        "confirm",
        "Bu işlem geri alınamaz!\nDevam etmek istediğinizden emin misiniz?"
    )){
		return
	}

    localStorage.clear();
    window.top.location.reload();
}


/**
 * @param {"delete" | "init" | "rinit"} mode
 */
async function ManageSetrings_grup_for_delclassButton(mode){
    let del_list = document.getElementById("setrings_grup_for_delclass").children[0].children[1]
    const noclassmsg = "Sınıf ekleyin"
    const classmsg   = "Seçiniz"

    if (mode === "delete"){
        if (del_list.value === ""){
            await parent.beter_alert("alert","Lütfen bir sınıf seçin!")
            return
        }

        await parent.delClass(del_list.value);
        ManageSetrings_grup_for_delclassButton("rinit")
    }else if (mode === "init"){
        let clases
        try{
            clases = load("classes")
        }catch{
            clases = []
        }
        
        if (clases.length === 0 ){
            setSelectPlaceholder(del_list,noclassmsg)
        }else {
            setSelectPlaceholder(del_list,classmsg)
        }
        clases.forEach(name => {
            del_list.add(new Option(name, name));
            
        });
    }else if(mode === "rinit"){
        
        del_list.querySelectorAll("option:not(:first-of-type)").forEach(option => option.remove());
        ManageSetrings_grup_for_delclassButton("init")
        Managesetrings_grup_for_delstudentButton("rinit","class")
    }else{
        throw new Error(`Geçersiz mode: ${mode}`);
    }
}
ManageSetrings_grup_for_delclassButton("init")


/**
 *  @param {"delete" | "init"    | "rinit" | "select"} mode
 *  @param { "class" | "student"                     } forr
 */
function Managesetrings_grup_for_delstudentButton(mode,forr){
    let class_select = document.getElementById("setrings_grup_for_delstudent").children[0].children[1]
    let stude_select = document.getElementById("setrings_grup_for_delstudent").children[0].children[2]
    const noclassmsg = "Sınıf ekleyin"
    const nostudemsg = "Öğrenci yok"
    const classmsg   = "Sınıf Seçiniz"
    const studemsg   = "Öğrenci Seçiniz"


    if (forr === "class"){
        if (mode === "delete"){
            throw new Error(`forr: ${forr} için mantıksız mode: ${mode} `);
        }else if (mode === "init"){
            let clases
            try{
                clases = load("classes")
            }catch{
                clases = []
            }

            if (clases.length === 0 ){
                setSelectPlaceholder(class_select,noclassmsg)
            }else {
                setSelectPlaceholder(class_select,classmsg)
            }
            clases.forEach(name => {
                class_select.add(new Option(name, name));
                
            });
        }else if(mode === "select"){
            Managesetrings_grup_for_delstudentButton("rinit","student")
        }else if(mode === "rinit"){
            class_select.querySelectorAll("option:not(:first-of-type)").forEach(option => option.remove());
            Managesetrings_grup_for_delstudentButton("init","class")
            Managesetrings_grup_for_delstudentButton("rinit","student")
        }else{
            throw new Error(`Geçersiz mode: ${mode}`);
        }
    }else if (forr === "student"){
        if (mode === "delete"){
            if (class_select.value === ""){
                return
            }
            remove_student(stude_select.value,class_select.value)
            Managesetrings_grup_for_delstudentButton("rinit","student")
        }else if (mode === "init"){
            if (class_select.value === ""){
                setSelectPlaceholder(stude_select,studemsg)
                return
            }
            let studeog
            try{
                studeog = parent.load(class_select.value)
            }catch{
                studeog = []
            }
            
            let stude   = Object.keys(studeog)
            

            if (stude.length === 0 ){
                setSelectPlaceholder(stude_select,nostudemsg)
            }else {
                setSelectPlaceholder(stude_select,studemsg)
            }
            stude.forEach(name => {
                stude_select.add(new Option(studeog[name].displayname, name));
                
            });
        }else if(mode === "rinit"){
            stude_select.querySelectorAll("option:not(:first-of-type)").forEach(option => option.remove());
            Managesetrings_grup_for_delstudentButton("init","student")
        }else if(mode === "select"){
            throw new Error(`forr: ${forr} için mantıksız mode: ${mode}`);
        }else{
            throw new Error(`Geçersiz mode: ${mode}`);
        }
    }else {
        throw new Error(`Geçersiz forr: ${mode}`);
    }
}
Managesetrings_grup_for_delstudentButton("init","class")

function remove_student(mane, class_name){

    let students = parent.load(class_name);

    delete students[mane.trim()];

    parent.save(class_name, students);

}


function setSelectPlaceholder(select,text){
    select.options[0].textContent = text

    if (select.selectedIndex === 0){
        select.querySelector("selectedcontent").textContent = text
    }
}
function transferDosyasiIndir() {
	const veriler = {};

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		veriler[key] = localStorage.getItem(key);
	}

	const dosya = new Blob([JSON.stringify(veriler, null, 4)], {
		type: "application/json;charset=utf-8"
	});

	const url = URL.createObjectURL(dosya);
	const link = document.createElement("a");

	link.href = url;
	link.download = "sinif-paneli-transfer.json";

	document.body.append(link);
	link.click();
	link.remove();

	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function transferDosyasiYukle() {
	const input = document.createElement("input");

	input.type = "file";
	input.accept = ".json,application/json";

	input.onchange = async () => {
		const dosya = input.files[0];

		if (!dosya) return;

		try {
			const veriler = JSON.parse(await dosya.text());

			if (
				veriler === null ||
				typeof veriler !== "object" ||
				Array.isArray(veriler) ||
				!Object.values(veriler).every(value => typeof value === "string")
			) {
				throw new Error("Geçersiz dosya");
			}

			for (const [key, value] of Object.entries(veriler)) {
				localStorage.setItem(key, value);
			}
		} catch {
			await window.parent.beter_alert("alert", "Transfer dosyası yüklenemedi. Dosya geçersiz olabilir veya tarayıcıda yeterli depolama alanı bulunmayabilir.");
			return;
		}

		window.parent.location.reload();
	};

	input.click();
}