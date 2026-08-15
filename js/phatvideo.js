// ======================================================
// PHATVIDEO.JS
// TURNSTILE → VERIFY WORKER → SESSION → VIDEO WORKER
// ======================================================


// ======================================================
// CONFIG
// ======================================================

const VERIFY_WORKER =
    "https://xac-minh-nguoi-dung.abcd1601ab.workers.dev";

const VIDEO_WORKER =
    "https://bot-api-phatvideo.abcd1601ab.workers.dev";


// ======================================================
// LẤY PARAMETER
// ======================================================

const params =
    new URLSearchParams(location.search);

const slug =
    params.get("slug");

const token =
    params.get("token");


// ======================================================
// HIỂN THỊ THÔNG BÁO
// ======================================================

function show(
    title,
    message,
    color = "#ff4d4f"
) {

    document.body.innerHTML = `

        <style>

        body {
            margin: 0;
            height: 100vh;

            display: flex;
            justify-content: center;
            align-items: center;

            background: #0f172a;

            font-family: Arial, sans-serif;

            color: #fff;
        }

        .box {
            width: 90%;
            max-width: 420px;

            padding: 30px;

            border-radius: 18px;

            background: #1e293b;

            text-align: center;

            box-shadow:
                0 0 25px rgba(0,0,0,.4);
        }

        h2 {
            margin: 0 0 15px;
            color: ${color};
        }

        p {
            margin: 0;

            opacity: .9;

            line-height: 1.6;
        }

        </style>

        <div class="box">

            <h2>${title}</h2>

            <p>${message}</p>

        </div>
    `;
}


// ======================================================
// LOADING
// ======================================================

function showLoading(
    title = "Đang kiểm tra...",
    message = "Vui lòng chờ vài giây."
) {

    document.body.innerHTML = `

        <style>

        body {
            margin: 0;
            height: 100vh;

            display: flex;
            justify-content: center;
            align-items: center;

            background: #0f172a;

            font-family: Arial, sans-serif;

            color: #fff;
        }

        .loader {
            text-align: center;
        }

        .spin {
            width: 65px;
            height: 65px;

            border: 6px solid rgba(255,255,255,.15);

            border-top: 6px solid #00d4ff;

            border-radius: 50%;

            animation:
                spin 1s linear infinite;

            margin: auto auto 20px;
        }

        @keyframes spin {

            to {
                transform: rotate(360deg);
            }

        }

        </style>

        <div class="loader">

            <div class="spin"></div>

            <h2>${title}</h2>

            <p>${message}</p>

        </div>
    `;
}


// ======================================================
// KIỂM TRA URL
// ======================================================

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


// ======================================================
// DEVICE ID
// ======================================================

function getDeviceId() {

    let deviceId =
        localStorage.getItem("deviceId");


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


// ======================================================
// LẤY SESSION ĐÃ LƯU
// ======================================================

function getSavedSession() {

    const session =
        sessionStorage.getItem(
            "video_session"
        );

    const expire =
        Number(
            sessionStorage.getItem(
                "video_session_expire"
            )
        );


    if (!session || !expire) {

        return null;
    }


    // Kiểm tra nhanh ở trình duyệt
    if (Date.now() >= expire) {

        clearSession();

        return null;
    }


    return session;
}


// ======================================================
// XÓA SESSION
// ======================================================

function clearSession() {

    sessionStorage.removeItem(
        "video_session"
    );

    sessionStorage.removeItem(
        "video_session_expire"
    );
}


// ======================================================
// KIỂM TRA SESSION VỚI VERIFY WORKER
// ======================================================

async function checkExistingSession() {

    const session =
        getSavedSession();


    if (!session) {

        return false;
    }


    try {

        const response =
            await fetch(

                VERIFY_WORKER +
                "/api/session?session=" +
                encodeURIComponent(session),

                {

                    method: "GET",

                    cache: "no-store"

                }

            );


        let result;


        try {

            result =
                await response.json();

        }

        catch {

            clearSession();

            return false;

        }


        console.log(
            "SESSION CHECK:",
            result
        );


        // ==========================================
        // SESSION CÒN HẠN
        // ==========================================

        if (
            response.ok &&
            result.success
        ) {

            // Worker là nguồn thời gian chính
            if (result.expire) {

                sessionStorage.setItem(

                    "video_session_expire",

                    String(
                        result.expire
                    )

                );

            }


            return true;
        }


    }

    catch (error) {

        console.error(
            "SESSION CHECK ERROR:",
            error
        );

    }


    // ==========================================
    // SESSION KHÔNG HỢP LỆ
    // ==========================================

    clearSession();

    return false;
}


// ======================================================
// XÁC MINH KEY VỚI VIDEO WORKER
// ======================================================

async function verifyKey(session) {

    if (!checkURL()) {

        return;
    }


    if (!session) {

        show(
            "🔐 Chưa xác minh",
            "Vui lòng xác minh Turnstile."
        );

        return;
    }


    showLoading(
        "Đang mở video...",
        "Đang kiểm tra KEY và thiết bị."
    );


    const deviceId =
        getDeviceId();


    try {

        const url =

            VIDEO_WORKER +

            "?slug=" +
            encodeURIComponent(slug) +

            "&token=" +
            encodeURIComponent(token) +

            "&deviceId=" +
            encodeURIComponent(deviceId) +

            "&session=" +
            encodeURIComponent(session);


        const response =
            await fetch(

                url,

                {
                    method: "GET",
                    cache: "no-store"
                }

            );


        // ==================================================
        // VIDEO WORKER CHO PHÉP
        // ==================================================

        if (response.ok) {

            const html =
                await response.text();


            document.open();

            document.write(html);

            document.close();

            return;
        }


        // ==================================================
        // VIDEO WORKER TRẢ JSON ERROR
        // ==================================================

        const text =
            await response.text();


        let result;


        try {

            result =
                JSON.parse(text);

        }

        catch {

            show(
                "❌ Lỗi máy chủ",
                text ||
                "Không thể phát video."
            );

            return;
        }


        // ==================================================
        // SESSION HẾT HẠN
        // ==================================================

        if (

            result.status ===
            "session_invalid"

            ||

            result.status ===
            "session_expired"

        ) {

            clearSession();


            show(
                "🔐 Phiên xác minh hết hạn",
                "Vui lòng tải lại trang và xác minh lại."
            );


            return;
        }


        // ==================================================
        // DEVICE BLOCK
        // ==================================================

        switch (
            result.status
        ) {

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
                    result.message ||
                    "Vui lòng thử lại sau."
                );

        }

    }

    catch (error) {

        console.error(
            "VIDEO ERROR:",
            error
        );


        show(
            "🌐 Lỗi kết nối",
            "Không thể kết nối đến máy chủ phát video."
        );

    }

}


// ======================================================
// TURNSTILE SUCCESS
// ======================================================

async function onVerified(
    turnstileToken
) {

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

        status.className =
            "status";
    }


    if (loading) {

        loading.style.display =
            "block";
    }


    try {

        // ==================================================
        // GỬI TOKEN TURNSTILE
        // ==================================================

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

                    body: JSON.stringify({

                        token:
                            turnstileToken

                    }),

                    cache: "no-store"

                }

            );


        // ==================================================
        // ĐỌC RESPONSE
        // ==================================================

        const result =
            await response.json();


        console.log(
            "VERIFY RESULT:",
            result
        );


        // ==================================================
        // VERIFY FAIL
        // ==================================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.message ||
                "Xác minh thất bại."

            );
        }


        // ==================================================
        // KIỂM TRA SESSION
        // ==================================================

        if (!result.session) {

            throw new Error(
                "Worker không trả về session."
            );
        }


        // ==================================================
        // LƯU SESSION
        // ==================================================

        sessionStorage.setItem(

            "video_session",

            result.session

        );


        // ==================================================
        // LƯU THỜI HẠN
        // ==================================================

        if (result.expire) {

            sessionStorage.setItem(

                "video_session_expire",

                String(
                    result.expire
                )

            );

        }


        // ==================================================
        // HIỂN THỊ THÀNH CÔNG
        // ==================================================

        if (status) {

            status.textContent =
                "Xác minh thành công. Đang mở video...";

            status.className =
                "status success";
        }


        if (loading) {

            loading.style.display =
                "none";
        }


        // ==================================================
        // ĐÓNG OVERLAY
        // ==================================================

        setTimeout(
            () => {

                const overlay =
                    document.getElementById(
                        "verifyOverlay"
                    );


                if (overlay) {

                    overlay.style.display =
                        "none";
                }


                // ==========================================
                // PHÁT VIDEO
                // ==========================================

                verifyKey(
                    result.session
                );

            },

            400

        );

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
                "status error";
        }


        // ==================================================
        // RESET TURNSTILE
        // ==================================================

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


// ======================================================
// TURNSTILE EXPIRED
// ======================================================

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
            "status error";
    }

}


// ======================================================
// TURNSTILE ERROR
// ======================================================

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
            "status error";
    }

}


// ======================================================
// KHỞI ĐỘNG
// ======================================================

async function startVideo() {

    // ==================================================
    // KIỂM TRA URL
    // ==================================================

    if (!checkURL()) {

        return;
    }


    // ==================================================
    // KIỂM TRA SESSION CŨ
    // ==================================================

    const hasValidSession =
        await checkExistingSession();


    // ==================================================
    // SESSION CÒN HẠN
    // ==================================================

    if (hasValidSession) {

        const session =
            sessionStorage.getItem(
                "video_session"
            );


        console.log(
            "SESSION CÒN HẠN → KHÔNG CẦN TURNSTILE"
        );


        verifyKey(
            session
        );


        return;
    }


    // ==================================================
    // KHÔNG CÓ SESSION
    // → HIỆN TURNSTILE
    // ==================================================

    console.log(
        "KHÔNG CÓ SESSION → CHỜ TURNSTILE"
    );


    const overlay =
        document.getElementById(
            "verifyOverlay"
        );


    if (overlay) {

        overlay.style.display =
            "flex";

    }

}


// ======================================================
// KHỞI ĐỘNG SAU KHI HTML LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    startVideo
);


// ======================================================
// LUỒNG
// ======================================================
//
// Lần đầu:
//
// phatvideo.html
//       ↓
// startVideo()
//       ↓
// không có session
//       ↓
// Turnstile
//       ↓
// onVerified()
//       ↓
// /api/verify
//       ↓
// session 10 phút
//       ↓
// verifyKey(session)
//       ↓
// bot-api-phatvideo
//       ↓
// VIDEO
//
//
// F5 trong 10 phút:
//
// phatvideo.html
//       ↓
// startVideo()
//       ↓
// sessionStorage có session
//       ↓
// /api/session
//       ↓
// Session OK
//       ↓
// verifyKey(session)
//       ↓
// VIDEO
//
//
// F5 sau 10 phút:
//
// phatvideo.html
//       ↓
// startVideo()
//       ↓
// /api/session
//       ↓
// Session hết hạn
//       ↓
// xóa session
//       ↓
// Turnstile
//       ↓
// xác minh lại
//
// ======================================================
