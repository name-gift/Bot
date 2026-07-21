const API =
"https://bot-api.abcd1601ab.workers.dev/";

let maintenance = false;

async function loadMaintenance(){

    let res = await fetch(API,{
        method:"POST",
        body:JSON.stringify({
            action:"getMaintenance"
        })
    });

    let data = await res.json();

    maintenance = data.maintenance;

    if(data.maintenanceUntil){

    const end = Number(data.maintenanceUntil);

    clearInterval(window.maintTimer);

    window.maintTimer = setInterval(()=>{

        const diff = end - Date.now();

        if(diff <= 0){

            maintTime.innerHTML =
            "✅ Đã kết thúc bảo trì";

            clearInterval(window.maintTimer);

            return;
        }

        const hours =
        Math.floor(diff / 3600000);

        const mins =
        Math.floor((diff % 3600000) / 60000);

        const secs =
        Math.floor((diff % 60000) / 1000);

        maintTime.innerHTML =
       `⏳ ${hours}h ${mins}m ${secs}s`;
    },1000);

}
    statusText.innerHTML =
        maintenance
        ? "🛠 Đang bảo trì"
        : "🟢 Online";

    if(maintenance){
        document.querySelector(".chat").style.display = "none";
        maintOverlay.style.display = "flex";
    }else{
        document.querySelector(".chat").style.display = "flex";
        maintOverlay.style.display = "none";
    }
}

loadMaintenance();

setInterval(loadMaintenance,30000);

function addMsg(text,type){

let div =
document.createElement("div");

div.className =
"msg " + type;

div.innerHTML = text;

messages.appendChild(div);

messages.scrollTop =
messages.scrollHeight;
}

/* AUTO START */

function autoStart(){

msg.value="/start ";

msg.focus();

}

msg.addEventListener(
"keypress",
function(e){

if(e.key==="Enter"){
send();
}

});

addMsg(`
✨ Xin chào<br><br>

Nhập key bằng lệnh:<br><br>

<code>/start KEY</code>
`,"bot");

async function send(){

let text =
msg.value.trim();

if(text=="") return;

addMsg(text,"user");

msg.value="";

if(maintenance){

addMsg(`
🛠 BOT ĐANG BẢO TRÌ
`,"bot");

return;
}

if(text.startsWith("/start")){

let parts =
text.split(" ");

if(parts.length < 2){

addMsg(`
❌ Vui lòng nhập key
`,"bot");

return;
}

let key =
parts[1];

let res =
await fetch(API,{
method:"POST",
body:JSON.stringify({
action:"getKey",
key
})
});

let data =
await res.json();

if(data.status=="found"){

addMsg(`

✅ KEY HỢP LỆ<br><br>

🔑 <b>${key}</b><br><br>

⏰ ${
data.expire=="never"
? "Vĩnh viễn"
: new Date(data.expire)
.toLocaleString("vi-VN")
}<br><br>

<a href="${data.link}"
target="_blank"
style="
display:inline-block;
padding:12px 18px;
background:linear-gradient(45deg,#00ff99,#00bfff);
border-radius:12px;
color:#08111f;
font-weight:700;
">

👉 MỞ LINK

</a>
`,"bot");

}

else if(data.status=="expired"){

addMsg(`

<div style="color:#ff6b6b;">

❌ KEY ĐÃ HẾT HẠN<br><br>

🔑 <b>${key}</b><br><br>

<div style="
background:#3a1111;
padding:12px;
border-radius:12px;
text-align:center;
font-weight:bold;
color:#ff4d4d;
cursor:not-allowed;
">

🚫 LINK ĐÃ KHÓA

</div>

</div>

`,"bot");

}

else{

addMsg(`
❌ KEY KHÔNG TỒN TẠI
`,"bot");

}

}

else{

addMsg(`
❌ Sai lệnh<br><br>

<code>/start KEY</code>
`,"bot");

}

}
