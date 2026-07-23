function loadVideos(){

    fetch(
    "https://script.google.com/macros/s/AKfycbwrcIhNszdf7N_FXLW4F78fTxCb_Mzg1mpYW7JmoqugiRuigMEksbtw7nTVtL4mAHbK/exec?type=video&page=1&limit=6"
)
    .then(res => res.json())
    .then(videos => {

        console.log(videos);

        let html = "";

        videos.forEach(video => {

            html += `
            <div class="video">
                <span>${video.ten}</span>

                <a class="btn key-btn"
                   href="nhankey.html?id=${video.id}">
                   🔑 Nhận Key
                </a>
            </div>
            `;

        });

        document.getElementById("videoList").innerHTML = html;

    })
    .catch(error => {

        console.error(error);

        document.getElementById("videoList").innerHTML =
        '<div class="loading">❌ Không tải được danh sách video</div>';

    });

}

// Tải lần đầu
loadVideos();

// Tự động tải lại mỗi 10 giây
setInterval(loadVideos, 10000);
