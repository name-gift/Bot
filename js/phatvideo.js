async function checkKey() {

  const userKey =
    document.getElementById("key").value.trim();

  try {

    const res = await fetch(
      "https://bot-api.abcd1601ab.workers.dev/"
    );

    const data = await res.json();

    if (!data.success) {
      document.getElementById("msg").textContent =
        "Không lấy được key từ API";
      return;
    }

    if (userKey !== data.key) {
      document.getElementById("msg").textContent =
        "❌ Key không đúng";
      return;
    }

    document.getElementById("login").style.display = "none";

    const player =
      document.getElementById("player");

    player.style.display = "block";

    const slug =
      new URLSearchParams(location.search).get("slug") || "tap0";

    player.src =
      "https://bot-api-phatvideo.abcd1601ab.workers.dev/?slug=" +
      encodeURIComponent(slug);

  } catch (e) {
    document.getElementById("msg").textContent =
      "Lỗi kết nối API";
  }
}