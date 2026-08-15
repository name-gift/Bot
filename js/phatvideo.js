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

function showLoading() {

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

            <h2>Đang xác minh KEY...</h2>

            <p>Vui lòng chờ vài giây.</p>

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
// XÁC MINH KEY VỚI WORKER PHÁT VIDEO
// ======================================================

async function verifyKey(session) {

    if (!checkURL()) {
        return;
    }


    if (!session) {

        show(
            "❌ Thiếu phiên xác minh",
            "Vui lòng xác minh lại."
        );

        return;
    }


    showLoading();


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
            await fetch(url);


        // ==================================================
        // SERVER CHO PHÉP PHÁT VIDEO
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
        // SERVER TRẢ JSON ERROR
        // ==================================================

        let result;


        const text =
            await response.text();


        try {

            result =
                JSON.parse(text);

        }

        catch {

            show(
                "❌ Lỗi máy chủ",
                text || "Không thể phát video."
            );

            return;
        }


        // ==================================================
        // XỬ LÝ ERROR
        // ==================================================

        switch (result.status) {


            case "session_invalid":

            case "session_expired":

                show(
                    "🔐 Phiên xác minh hết hạn",
                    "Vui lòng xác minh lại."
                );

                break;


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

        status.className = "status";

    }


    if (loading) {

        loading.style.display =
            "block";

    }


    try {

        // ==================================================
        // GỬI TURNSTILE TOKEN ĐẾN VERIFY WORKER
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

                    })

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
        // LƯU THỜI GIAN HẾT HẠN
        // ==================================================

        if (result.expire) {

            sessionStorage.setItem(
                "video_session_expire",
                String(result.expire)
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

        setTimeout(() => {

            const overlay =
                document.getElementById(
                    "verifyOverlay"
                );


            if (overlay) {

                overlay.style.display =
                    "none";

            }


            // ==============================================
            // GỬI SESSION SANG WORKER PHÁT VIDEO
            // ==============================================

            verifyKey(
                result.session
            );

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
                "status error";

        }


        // ==================================================
        // RESET TURNSTILE
        // ==================================================

        if (window.turnstile) {

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
// KHÔNG GỌI verifyKey() Ở ĐÂY
// ======================================================
//
// Turnstile phải gọi:
//
// onVerified(token)
//       ↓
// Verify Worker
//       ↓
// session
//       ↓
// verifyKey(session)
//       ↓
// Video Worker
//
// ======================================================
