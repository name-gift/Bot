const API = "https://bot-api.abcd1601ab.workers.dev/";

(async () => {

  const params = new URLSearchParams(location.search);

  const slug = params.get("slug");
  const token = params.get("token");

  if (!slug || !token) {

    document.body.innerHTML =
      "<h2>❌ Thiếu slug hoặc token</h2>";

    return;

  }

  // Device ID
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {

    deviceId = crypto.randomUUID();

    localStorage.setItem("deviceId", deviceId);

  }

  // Kiểm tra token
  const res = await fetch(API, {

    method: "POST",

    body: JSON.stringify({

      action: "checkVideoToken",

      token,

      slug,

      deviceId

    })

  });

  const data = await res.json();

  if (data.status !== "success") {

    document.body.innerHTML =
      "<h2>❌ Token không hợp lệ</h2>";

    return;

  }

  // Lấy link video theo slug
  const video = await fetch(

    API +
    "?type=slug&slug=" +
    encodeURIComponent(slug)

  );

  const videoData = await video.json();

  if (!videoData.success) {

    document.body.innerHTML =
      "<h2>❌ Không tìm thấy video</h2>";

    return;

  }

  document.getElementById("player").src =
    videoData.link;

})();
