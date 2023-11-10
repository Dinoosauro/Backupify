(() => {
let token = window.location.href.substring(window.location.href.indexOf("access_token=")).replace("access_token=", "");
token = token.substring(0, token.indexOf("&"));
history.pushState(null, "", "next.html");
let standardFetchLink = "";
let playlistURL = "";
document.getElementById("export").addEventListener("click", () => {
    document.querySelectorAll("[data-disable]").forEach(e => e.setAttribute("disabled", ""));
    changeDialogColor(0);
    playlistURL = document.getElementById("ytVideo").value.substring(document.getElementById("ytVideo").value.indexOf("?list=")).replace("?list=", "");
    if (playlistURL.indexOf("&") !== -1) playlistURL = playlistURL.substring(0, playlistURL.indexOf("&"));
    standardFetchLink = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails${parseInt(document.getElementById("exportOptions").value) > 1 ? ",id,snippet,status" : ""}&playlistId=${playlistURL}&access_token=${encodeURIComponent(token)}&maxResults=50`;
    fetchVal(standardFetchLink);
})
let playlistArray = [];
let startProgress = 0;
function fetchVal(link) {
    fetch(link).then((res) => {
        if (res.status.toString().startsWith("2")) {
            res.json().then((json) => {
                startProgress += 50;
                document.getElementById("videoExported").textContent = startProgress;
                playlistArray.push(...json.items);
                if ((json.nextPageToken ?? "") !== "") fetchVal(`${standardFetchLink}&pageToken=${encodeURIComponent(json.nextPageToken)}`); else extractLink();
            })
        } else {
            res.json().then((error) => {
                console.error(error);
                changeDialogColor(1)
                switch (error.error.errors[0].reason.toLowerCase()) {
                    case "quotaexceeded":
                        document.getElementById("errorDesc").textContent = "Reached maxinum quota for today.";
                        extractLink();
                        break;
                    case "playlistnotfound":
                        document.getElementById("errorDesc").textContent = "Cannot find the requested playlist.";
                        document.querySelectorAll("[data-disable]").forEach(e => e.removeAttribute("disabled"));
                        setTimeout(() => opacityRemove(document.getElementById("processDialog")), 4000);
                        break;
                    case "playlistitemsnotaccessible":
                        document.getElementById("errorDesc").textContent = "Cannot retrieve the provided playlist. Make sure that your account can read the provided playlist.";
                        document.querySelectorAll("[data-disable]").forEach(e => e.removeAttribute("disabled"));
                        setTimeout(() => opacityRemove(document.getElementById("processDialog")), 4000);
                        break;
                    case "autherror":
                        document.getElementById("errorDesc").textContent = "The token probably has expired. You'll be redirected to the login page. Please login again.";
                        setTimeout(() => { window.location.href = window.location.origin }, 4000);
                        break;
                    default:
                        document.getElementById("errorDesc").textContent = `${error.error.status}: ${error.error.message} [${error.error.code}]`
                        break;
                }
            })
        }
    })
}
function changeDialogColor(type) {
    opacityAdd(document.getElementById("processDialog"), "flex");
    document.getElementById("exportProgress").style.display = type === 0 ? "" : "none";
    document.getElementById("failedReq").style.display = type === 1 ? "" : "none";
    document.getElementById("completeReq").style.display = type === 2 ? "" : "none";
    document.getElementById("processBackground").style.backgroundColor = themes.errorCodes[themes.applied][type];
}
function extractLink() {
    let final = parseInt(document.getElementById("exportOptions").value) > 1 ? "Title,Video URL,Description,Creator name,Creator id,Creation date,Video visibility,Playlist ID,Added by (ID),Added by (Username),Added at,Thumbnail links,Thumbnail quality,Playlist position\n" : "";
    if (parseInt(document.getElementById("exportOptions").value) === 4) final = "Title,Video URL,Thumbnail link,Thumbnail quality\n";
    playlistArray.forEach(e => {
        let finalLink = `https://youtube.com/watch?v=${e.contentDetails.videoId}`;
        let thumbnailSay = ["", ""];
        let thumbnailArray;
        if (parseInt(document.getElementById("exportOptions").value) > 1) {
            thumbnailArray = Object.values(e.snippet.thumbnails).sort((a, b) => b.width - a.width);
            thumbnailArray.forEach(t => { thumbnailSay[0] += `${t.url}\n`; thumbnailSay[1] += `${t.width}:${t.height}\n` })
        }
        switch (parseInt(document.getElementById("exportOptions").value)) {
            case 1:
                final += `https://youtu.be/${e.contentDetails.videoId}\n`;
                break;
            case 2:
                final += `"${(e.snippet.title ?? "").replaceAll("\"", "'")}","${finalLink}","${(e.snippet.description ?? "").replaceAll("\"", "'")}","${(e.snippet.videoOwnerChannelTitle ?? "").replaceAll("\"", "'")}","${e.snippet.videoOwnerChannelId}","${e.snippet.publishedAt}","${e.status.privacyStatus}","${e.snippet.channelId}","${e.snippet.playlistId}","${(e.snippet.channelTitle ?? "").replaceAll("\"", "'")}","${e.contentDetails.videoPublishedAt}","${thumbnailSay[0].replaceAll("\"", "'")}","${thumbnailSay[1].replaceAll("\"", "")}","${e.snippet.position}"\n`;
                break;
            case 3:
                final += `"${(e.snippet.title ?? "").replaceAll("\"", "'")}","${finalLink}","${(e.snippet.description ?? "").replaceAll("\"", "'")}","${(e.snippet.videoOwnerChannelTitle ?? "").replaceAll("\"", "'")}","${e.snippet.videoOwnerChannelId}","${e.snippet.publishedAt}","${e.status.privacyStatus}","${e.snippet.channelId}","${e.snippet.playlistId}","${(e.snippet.channelTitle ?? "").replaceAll("\"", "'")}","${e.contentDetails.videoPublishedAt}","${thumbnailArray[0].url.replaceAll("\"", "'")}","${thumbnailArray[0].width}:${thumbnailArray[0].height}","${e.snippet.position}"\n`;
                break;
            case 4:
                final += `"${(e.snippet.title ?? "").replaceAll("\"", "'")}","${finalLink}","${thumbnailArray[0].url.replaceAll("\"", "'")}","${thumbnailArray[0].width}:${thumbnailArray[0].height}"\n`;
                break;
            default:
                final += `${finalLink}\n`;
                break;
        }
    });
    playlistArray = [];
    startProgress = 0;
    document.getElementById("linkAppend").innerHTML = "";
    changeDialogColor(2);
    document.querySelectorAll("[data-disable]").forEach(e => e.removeAttribute("disabled"));
    downloadText(final, `Exported ${playlistURL}.${parseInt(document.getElementById("exportOptions").value) > 1 ? "csv" : "txt"}`);
}
function downloadText(text, name) {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = name;
    a.textContent = "Retry download";
    document.getElementById("linkAppend").append(a);
    a.click();
    setTimeout(() => opacityRemove(document.getElementById("processDialog")), 4000);
}
document.getElementById("exportOptions").addEventListener("change", () => {
    localStorage.setItem("PlaylistExporter-ExportSelect", document.getElementById("exportOptions").value);
})
if ((localStorage.getItem("PlaylistExporter-ExportSelect") ?? "") !== "") document.getElementById("exportOptions").value = localStorage.getItem("PlaylistExporter-ExportSelect");
function resizeTextbox() {
    document.getElementById("ytVideo").style.maxWidth = `${document.getElementById("container").offsetWidth - 14}px`;
}
resizeTextbox();
window.addEventListener("resize", () => resizeTextbox());
})();