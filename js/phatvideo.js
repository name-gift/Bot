
const p = new URLSearchParams(location.search);

const slug = p.get("slug");
const token = p.get("token");

function show(title, msg, color = "#ff4d4f") {

document.body.innerHTML = `
<style>

body{

margin:0;
height:100vh;

display:flex;
justify-content:center;
align-items:center;

background:#0f172a;

font-family:Poppins,sans-serif;

color:#fff;

}

.box{

width:90%;
max-width:420px;

padding:30px;

border-radius:18px;

background:#1e293b;

text-align:center;

box-shadow:0 0 25px rgba(0,0,0,.4);

}

h2{

margin:0 0 15px;

color:${color};

}

p{

margin:0;

opacity:.9;

line-height:1.6;

}

</style>

<div class="box">

<h2>${title}</h2>

<p>${msg}</p>

</div>
`;

}

if(!slug || !token){

show(
"❌ Liên kết không hợp lệ",
"Vui lòng nhận lại KEY từ BOT."
);

throw "";

}

document.body.innerHTML=`

<style>

body{

margin:0;

height:100vh;

display:flex;

justify-content:center;

align-items:center;

background:#0f172a;

font-family:Poppins,sans-serif;

color:#fff;

}

.loader{

text-align:center;

}

.spin{

width:65px;

height:65px;

border:6px solid rgba(255,255,255,.15);

border-top:6px solid #00d4ff;

border-radius:50%;

animation:spin 1s linear infinite;

margin:auto auto 20px;

}

@keyframes spin{

to{

transform:rotate(360deg);

}

}

</style>

<div class="loader">

<div class="spin"></div>

<h2>Đang xác minh KEY...</h2>

<p>Vui lòng chờ vài giây.</p>

</div>

`;

let deviceId = localStorage.getItem("deviceId");

if(!deviceId){

deviceId = crypto.randomUUID();

localStorage.setItem("deviceId",deviceId);

}

fetch(

"https://bot-api-phatvideo.abcd1601ab.workers.dev/"

+ "?slug=" + encodeURIComponent(slug)

+ "&token=" + encodeURIComponent(token)

+ "&deviceId=" + encodeURIComponent(deviceId)

)

.then(async r=>{

if(r.ok){

const html=await r.text();

document.open();

document.write(html);

document.close();

return;

}

let txt=await r.text();

try{

txt=JSON.parse(txt);

}catch{

show("❌ Lỗi",txt);

return;

}

switch(txt.status){

case "device_blocked":

show(
"🚫 Thiết bị không được phép",
"KEY này đã được sử dụng trên một thiết bị khác."
);

break;

case "wrong_slug":

show(
"⚠ Sai video",
"KEY này chỉ dùng để xem video khác."
);

break;

case "expired":

show(
"⌛ KEY đã hết hạn",
"Vui lòng nhận KEY mới từ BOT."
);

break;

case "fail":

show(
"❌ KEY không hợp lệ",
"KEY không tồn tại hoặc đã bị thu hồi."
);

break;

default:

show(
"❌ Không thể phát video",
"Vui lòng thử lại sau."
);

}

})

.catch(()=>{

show(
"🌐 Lỗi kết nối",
"Không thể kết nối đến máy chủ."
);

});
