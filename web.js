(async ()=>{
    const fetchPlaylist = require("./js/fetchUserLib");
    const getPlaylist = require("./js/fetchPlaylistDetails");
    let token = window.location.hash.substring(window.location.hash.indexOf("access_token=")).replace("access_token=", "");
    token = token.substring(0, token.indexOf("&"));
    history.pushState(null, "", "next.html");
    let result = await fetchPlaylist("https://api.spotify.com/v1/me/playlists?limit=50", token); // Get user playlists
    function parseResult(json, prepend) { // Create a table with each fetched playlist from the user library. 
        for (let item of json.arr) {
            let div = document.createElement("tr"); // Create table row
            let checkboxCointainer = document.createElement("td");
            let checkbox = document.createElement("input"); // Checkbox
            checkbox.type = "checkbox";
            checkbox.setAttribute("data-id", item.id); // Set data-id so that the ID can be later fetched with a querySelector
            checkboxCointainer.append(checkbox);
            let image = document.createElement("td");
            let imageEl = document.createElement("img"); // Playlist image
            imageEl.src = item.img;
            image.append(imageEl);
            let name = document.createElement("td");
            let link = document.createElement("a"); // The name (and the link) of the Spotify playlist
            link.target = "_blank";
            link.textContent = item.name;
            link.href = `https://open.spotify.com/playlist/${item.id}`;
            name.append(link);
            checkbox.checked = prepend ?? false; // If the item must be added on top, it means that it's selected.
            name.style.textAlign = "center";
            div.append(checkboxCointainer, image, name);
            prepend && (document.getElementById("playlistContainer").querySelectorAll("tr").length > 1) !== "" ? document.getElementById("playlistContainer").insertBefore(div, document.getElementById("playlistContainer").querySelectorAll("tr")[1]) : document.getElementById("playlistContainer").append(div); // If it must be added on top and there're other rows, add it as the second row (the first one is the header). Otherwise, add it on the bottom of the table.
            if (document.querySelectorAll(`[data-id='${item.id}']`).length > 1) { // If a playlist is there for more than one time, get all the rows that refer to that playlist, and remove all of them (expect the first one).
                let arr = Array.from(document.querySelectorAll(`[data-id='${item.id}']`));
                arr.shift();
                arr.forEach(e => e.parentElement.parentElement.remove());
            }
        }
    }
    parseResult(result);
    function addOldSelection() { // If the user has saved its previous choice(s), add them on top of everything else.
        if ((localStorage.getItem("Backupify-PlaylistIDs") ?? "") !== "") { // If the previous selection was saved
            document.getElementById("saveSelection").checked = true; // Make the "Save selection" checkbox checked
            for (let item of JSON.parse(localStorage.getItem("Backupify-PlaylistIDs"))) {
                 getPlaylist(token, item).then((getResult) => { // Don't wait timeout for each playlist here so that, if there's a missing playlist, it won't make the website slow
                    if (getResult) parseResult(getResult, true);  // If there isn't an error, add the new playlist on top.
                 });      
            }
    }
    }
    addOldSelection();
    let tableDiv = document.getElementById("fetchMore"); // The ID of the scrollable part of the table
    let isFetching = false;
    tableDiv.addEventListener("scroll", async () => { // Check if the user has reached more than 85% of the height, and load more items.
        if (Math.round((tableDiv.scrollTop / (tableDiv.scrollHeight - tableDiv.offsetHeight)) * 100 > 85) && (result.next ?? "") !== "" && !isFetching) {
            isFetching = true; // Set this to true so that, if the user continues scrolling, the same request won't be made two times.
            result = await fetchPlaylist(result.next, token); // Get the playlist info
            parseResult(result); // And then add it to the table at the bottom
            isFetching = false;
        }

    })
    document.getElementById("goToName").addEventListener("click", async () => { // The button that permits the user to choose the playlist name
        await opacityRemove(document.querySelector("[data-step=choose]")); // Opacity transition: remove the old table
        opacityAdd(document.querySelector("[data-step=name]"));  // Opacity transition: show the new table
        for (let item of Array.from(document.querySelectorAll("#playlistContainer > tr > td > input[type='checkbox']")).filter(e => e.checked)) { // Get all of the checked checkboxes from the table
            let getId = item.getAttribute("data-id"); // Get playlist ID
            if ((document.querySelector(`[data-editid='${getId}']`) ?? "") !== "") continue; // If a table for this filter has been created previously, don't create it another time.
            let node = item.parentElement.parentElement.cloneNode(true); // Clone the table row that contained the old playlist
            node.firstChild.remove(); // Remove the checkbox
            let inputContainer = document.createElement("td"); 
            let text = document.createElement("input"); // Create the textbox where the user can choose the name
            text.type = "text";
            text.setAttribute("data-editid", getId); // Set the playlist ID to the textbox
            inputContainer.append(text);
            node.append(inputContainer);
            document.getElementById("playlistName").append(node);
        }
        for (let item of Array.from(document.querySelectorAll("[data-editid]"))) if (!document.querySelector(`[data-id='${item.getAttribute("data-editid")}']`).checked) item.parentElement.parentElement.remove();  // Check if the user unchecked some items and, if true, remove them from the DOM.
        savePlaylist();
    });
    document.getElementById("goBack").addEventListener("click", async () => { // Go back to the first table (choose the playlists)
        await opacityRemove(document.querySelector("[data-step=name]"));
        opacityAdd(document.querySelector("[data-step=choose]"));
    })
    document.getElementById("startProcess").addEventListener("click", async () => { // Start duplicating playlists
        await opacityRemove(document.querySelector("[data-step=name]"));
        opacityAdd(document.querySelector("[data-step=convert]"));
        const backup = require("./js/commonUsage"); // The JavaScript module that'll handle playlists
        let fileBackup = {}; // The object that'll contain the playlist ID (as a key) and the new playlist name (as a value)
        for (let item of document.querySelectorAll("[data-editid]")) { 
            if ((item.value ?? "") === "") item.value = item.getAttribute("data-editid");
            fileBackup[item.value] = item.getAttribute("data-editid");
        }
        backup(token, fileBackup).then(() => { // Start backup of playlists. After it has finished, inform the user.
            document.getElementById("startBackup").textContent = "Finished!";
            document.getElementById("intelliLog").style.backgroundColor = "var(--firstcontent)";
            document.getElementById("evertythingContainer").style.backgroundColor = "var(--success)";
        });
    });
    function parseUserSpotify(val) {
        if (val.indexOf("spotify") === -1) return val; // A real playlist ID
        if (val.indexOf("?") !== -1) val = val.substring(0, val.indexOf("?")); // Delete eventual search queries from the provided URL
        if (val.indexOf("/") !== -1) val = val.substring(val.lastIndexOf("/") + 1); // Delete the eventual Spotify webpage URL
        if (val.indexOf(":") !== -1) val = val.substring(val.lastIndexOf(":") + 1); // Delete the eventual part before the Playlist ID in the "spotify:playlist:id" scheme
        return val.trim(); 
    }
    document.getElementById("addCustom").addEventListener("click", async () => { // Backup a playlist by providing a custom ID in the "choose the playlists" section
        let getResult = await getPlaylist(token, parseUserSpotify(document.getElementById("customId").value)); // Get the playlist info
        if (getResult) parseResult(getResult, true); // And, if it's a valid playlist, add it at the top of the table
    });
    function savePlaylist() { // Save the playlist selection in the DOM
        document.getElementById("saveSelection").checked ? localStorage.setItem("Backupify-PlaylistIDs", JSON.stringify(Array.from(document.querySelectorAll("[data-editid]")).map(e => { return e.getAttribute("data-editid") }))) : localStorage.removeItem("Backupify-PlaylistIDs"); // If it's checked, add in the LocalStorage an array of the selected playlist IDs. Otherwise, remove it.
    }
    document.getElementById("saveSelection").addEventListener("change", () => savePlaylist());
    document.getElementById("backStart").addEventListener("click", async () => { // After the user has finished converting the playlist, go back to the playlist selection UI
        document.getElementById("evertythingContainer").style.backgroundColor = "";
        await opacityRemove(document.querySelector("[data-step=convert]"));
        opacityAdd(document.querySelector("[data-step=choose]"));
    })
})();
console.intelliLog = (msg, type, item) => { // The function that'll manage informing users about playlist progress
    let symbolRef = { // An object that contains the emoji and the color of the gravity of the info
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
    document.getElementById("intelliUpdate").textContent = msg; // Set the text provided by the event
    document.getElementById("intelliLog").style.backgroundColor = symbolRef[type].color; // And the color
    let l = document.createElement("l");
    l.textContent = `${symbolRef[type].emoji} | ${msg}${(item ?? "") !== "" ? ` | ${item}` : ""}`; // Set this for the event history
    document.getElementById("history").append(l, document.createElement("br"));
}