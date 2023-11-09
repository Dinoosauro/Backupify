(async ()=>{
    const fetchPlaylist = require("./js/fetchUserLib");
    const getPlaylist = require("./js/fetchPlaylistDetails");
    let token = window.location.hash.substring(window.location.hash.indexOf("access_token=")).replace("access_token=", "");
    token = token.substring(0, token.indexOf("&"));
    history.pushState(null, "", "next.html");
    let result = await fetchPlaylist("https://api.spotify.com/v1/me/playlists?limit=50", token);
    function parseResult(json, prepend) {
        for (let item of json.arr) {
            let div = document.createElement("tr");
            let checkboxCointainer = document.createElement("td");
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.setAttribute("data-id", item.id);
            checkboxCointainer.append(checkbox);
            let image = document.createElement("td");
            let imageEl = document.createElement("img");
            imageEl.src = item.img;
            image.append(imageEl);
            let name = document.createElement("td");
            let link = document.createElement("a");
            link.target = "_blank";
            link.textContent = item.name;
            link.href = `https://open.spotify.com/playlist/${item.id}`;
            name.append(link);
            checkbox.checked = prepend ?? false;
            name.style.textAlign = "center";
            div.append(checkboxCointainer, image, name);
            prepend && (document.getElementById("playlistContainer").querySelectorAll("tr").length > 1) !== "" ? document.getElementById("playlistContainer").insertBefore(div, document.getElementById("playlistContainer").querySelectorAll("tr")[1]) : document.getElementById("playlistContainer").append(div);
            if (document.querySelectorAll(`[data-id='${item.id}']`).length > 1) {
                let arr = Array.from(document.querySelectorAll(`[data-id='${item.id}']`));
                arr.shift();
                arr.forEach(e => e.parentElement.parentElement.remove());
            }
        }
    }
    parseResult(result);
    function addOldSelection() {
        if ((localStorage.getItem("Backupify-PlaylistIDs") ?? "") !== "") {
            document.getElementById("saveSelection").checked = true;
            for (let item of JSON.parse(localStorage.getItem("Backupify-PlaylistIDs"))) {
                 getPlaylist(token, item).then((getResult) => { // Use then here so that if there's a missing playlist it won't make the website slow
                    if (getResult) parseResult(getResult, true);  
                 });      
            }
    }
    }
    addOldSelection();
    let tableDiv = document.getElementById("fetchMore");
    let isFetching = false;
    tableDiv.addEventListener("scroll", async () => {
        if (Math.round((tableDiv.scrollTop / (tableDiv.scrollHeight - tableDiv.offsetHeight)) * 100 > 85) && (result.next ?? "") !== "" && !isFetching) {
            isFetching = true;
            result = await fetchPlaylist(result.next, token);
            parseResult(result);
            isFetching = false;
        }

    })
    document.getElementById("goToName").addEventListener("click", async () => {
        await opacityRemove(document.querySelector("[data-step=choose]"));
        opacityAdd(document.querySelector("[data-step=name]"));
        for (let item of Array.from(document.querySelectorAll("#playlistContainer > tr > td > input[type='checkbox']")).filter(e => e.checked)) {
            let getId = item.getAttribute("data-id");
            if ((document.querySelector(`[data-editid='${getId}']`) ?? "") !== "") continue;
            let node = item.parentElement.parentElement.cloneNode(true);
            node.firstChild.remove();
            let inputContainer = document.createElement("td");
            let text = document.createElement("input");
            text.type = "text";
            text.setAttribute("data-editid", getId);
            inputContainer.append(text);
            node.append(inputContainer);
            document.getElementById("playlistName").append(node);
        }
        for (let item of Array.from(document.querySelectorAll("[data-editid]"))) if (!document.querySelector(`[data-id='${item.getAttribute("data-editid")}']`).checked) item.parentElement.parentElement.remove(); 
        savePlaylist();
    });
    document.getElementById("goBack").addEventListener("click", async () => {
        await opacityRemove(document.querySelector("[data-step=name]"));
        opacityAdd(document.querySelector("[data-step=choose]"));
    })
    document.getElementById("startProcess").addEventListener("click", async () => {
        await opacityRemove(document.querySelector("[data-step=name]"));
        opacityAdd(document.querySelector("[data-step=convert]"));
        const backup = require("./js/commonUsage");
        let fileBackup = {};
        for (let item of document.querySelectorAll("[data-editid]")) {
            if ((item.value ?? "") === "") item.value = item.getAttribute("data-editid");
            fileBackup[item.value] = item.getAttribute("data-editid");
        }
        backup(token, fileBackup).then(() => {
            document.getElementById("startBackup").textContent = "Finished!";
            document.getElementById("intelliLog").style.backgroundColor = "var(--firstcontent)";
            document.getElementById("evertythingContainer").style.backgroundColor = "var(--success)";
        });
    });
    document.getElementById("addCustom").addEventListener("click", async () => {
        let getResult = await getPlaylist(token, document.getElementById("customId").value);
        if (getResult) parseResult(getResult, true);
    });
    function savePlaylist() {
        document.getElementById("saveSelection").checked ? localStorage.setItem("Backupify-PlaylistIDs", JSON.stringify(Array.from(document.querySelectorAll("[data-editid]")).map(e => { return e.getAttribute("data-editid") }))) : localStorage.removeItem("Backupify-PlaylistIDs");
    }
    document.getElementById("saveSelection").addEventListener("change", () => savePlaylist());
    document.getElementById("backStart").addEventListener("click", async () => {
        document.getElementById("evertythingContainer").style.backgroundColor = "";
        await opacityRemove(document.querySelector("[data-step=convert]"));
        opacityAdd(document.querySelector("[data-step=choose]"));
    })
})();
console.intelliLog = (msg, type, item) => {
    let symbolRef = {
        info: {
            emoji: "ℹ️",
            color: "var(--secondcontent)"
        },
        success: {
            emoji: "✅",
            color: "var(--success)"
        },
        warning: {
            emoji: "⚠️",
            color: "var(--warning)"
        },
        error: {
            emoji: "❌",
            color: "var(--error)"
        }
    }
    document.getElementById("intelliUpdate").textContent = msg;
    document.getElementById("intelliLog").style.backgroundColor = symbolRef[type].color;
    let l = document.createElement("l");
    l.textContent = `${symbolRef[type].emoji} | ${msg}${(item ?? "") !== "" ? ` | ${item}` : ""}`;
    document.getElementById("history").append(l, document.createElement("br"));
}
