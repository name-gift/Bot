/* ========================================
   CLOUDFLARE WORKER XÁC MINH TURNSTILE
======================================== */

const VERIFY_WORKER =
    "https://xac-thuc-nguoi-dung.abcd1601ab.workers.dev";


/* ========================================
   LẤY PARAMETER
======================================== */

const p =
    new URLSearchParams(
        location.search
    );

const slug =
    p.get("slug");

const token =
    p.get("token");


/* ========================================
   HIỂN THỊ LỖI
======================================== */

function show(
    title,
    msg,
    color = "#ff4d4f"
) {

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

        box-shadow:
            0 0 25px rgba(0,0,0,.4);

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


/* ========================================
   LOADING
======================================== */

function showLoading() {

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

    .loader{

        text-align:center;

    }

    .spin{

        width:65px;

        height:65px;

        border:6px solid rgba(255,255,255,.15);

        border-top:6px solid #00d4ff;

        border-radius:50%;

        animation:
            spin 1s linear infinite;

        margin:
            auto auto 20px;

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

}


/* ========================================
   KIỂM TRA URL
======================================== */

function checkURL() {

    if (!slug || !token) {

        show(

            "❌ Liên kết không hợp lệ",

            "Vui lòng nhận lại KEY từ BOT."

        );

        return false;

    }

    return true;

}


/* ========================================
   TẠO DEVICE ID
======================================== */

function getDeviceId() {

    let deviceId =
        localStorage.getItem(
            "deviceId"
        );


    if (!deviceId) {

        deviceId =
            crypto.randomUUID();

        localStorage.setItem(
            "deviceId",
            deviceId
        );

    }


    return deviceId;

}


/* ========================================
   XÁC MINH KEY
======================================== */

function verifyKey() {

    if (!checkURL()) {

        return;

    }


    showLoading();


    const deviceId =
        getDeviceId();


    fetch(

        "https://bot-api-phatvideo.abcd1601ab.workers.dev/" +

        "?slug=" +
        encodeURIComponent(slug) +

        "&token=" +
        encodeURIComponent(token) +

        "&deviceId=" +
        encodeURIComponent(deviceId)

    )

    .then(async r => {


        /* =================================
           SERVER TRẢ HTML VIDEO
        ================================= */

        if (r.ok) {

            const html =
                await r.text();


            document.open();

            document.write(html);

            document.close();

            return;

        }


        /* =================================
           SERVER TRẢ JSON ERROR
        ================================= */

        let txt =
            await r.text();


        try {

            txt =
                JSON.parse(txt);

        }

        catch {

            show(
                "❌ Lỗi",
                txt
            );

            return;

        }


        /* =================================
           XỬ LÝ ERROR
        ================================= */

        switch (txt.status) {


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


    .catch(() => {

        show(

            "🌐 Lỗi kết nối",

            "Không thể kết nối đến máy chủ."

        );

    });

}


/* ========================================
   TURNSTILE SUCCESS
======================================== */

async function onVerified(turnstileToken) {


    const status =
        document.getElementById(
            "verifyStatus"
        );


    const loading =
        document.getElementById(
            "verifyLoading"
        );


    if (status) {

        status.textContent =
            "Đang kiểm tra xác minh...";

        status.className = "";

    }


    if (loading) {

        loading.style.display =
            "block";

    }


    try {


        /* ================================
           GỬI TOKEN TURNSTILE
        ================================= */

        const response =
            await fetch(

                VERIFY_WORKER +
                "/api/verify",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            token:
                                turnstileToken

                        })

                }

            );


        const result =
            await response.json();


        /* ================================
           XÁC MINH THẤT BẠI
        ================================= */

        if (

            !response.ok ||

            !result.success

        ) {

            throw new Error(

                result.message ||

                "Xác minh thất bại."

            );

        }


        /* ================================
           XÁC MINH THÀNH CÔNG
        ================================= */

        if (status) {

            status.textContent =
                "Xác minh thành công.";

            status.className =
                "success";

        }


        if (loading) {

            loading.style.display =
                "none";

        }


        /* ================================
           LƯU SESSION
        ================================= */

        if (result.session) {

            sessionStorage.setItem(

                "video_session",

                result.session

            );

        }


        /* ================================
           CHO PHÉP CHẠY KEY
        ================================= */

        setTimeout(() => {

            const overlay =
                document.getElementById(
                    "verifyOverlay"
                );


            if (overlay) {

                overlay.style.display =
                    "none";

            }


            verifyKey();

        }, 400);


    }

    catch (error) {


        console.error(
            "TURNSTILE ERROR:",
            error
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (status) {

            status.textContent =
                error.message ||
                "Không thể xác minh.";

            status.className =
                "error";

        }


        /* ================================
           RESET TURNSTILE
        ================================= */

        if (
            window.turnstile
        ) {

            try {

                turnstile.reset();

            }

            catch (_) {}

        }

    }

}


/* ========================================
   TURNSTILE EXPIRED
======================================== */

function onExpired() {

    const status =
        document.getElementById(
            "verifyStatus"
        );


    const loading =
        document.getElementById(
            "verifyLoading"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (status) {

        status.textContent =
            "Xác minh đã hết hạn. Vui lòng thử lại.";

        status.className =
            "error";

    }

}


/* ========================================
   TURNSTILE ERROR
======================================== */

function onError() {

    const status =
        document.getElementById(
            "verifyStatus"
        );


    const loading =
        document.getElementById(
            "verifyLoading"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (status) {

        status.textContent =
            "Không thể xác minh. Vui lòng thử lại.";

        status.className =
            "error";

    }

}


/* ========================================
   KHỞI ĐỘNG
========================================

   Không gọi verifyKey() trực tiếp.

   Turnstile phải xác minh trước.

======================================== */
