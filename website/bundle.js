(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = async (token, playlist, songs) => {
    let returnVal = true;
    let errorCount = 0;
    async function addSongs(smallArr) {
        if (errorCount > 5) {
            returnVal = false;
            return false;
        }
        let addReq = await fetch(`https://api.spotify.com/v1/playlists/${playlist}/tracks`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                uris: smallArr,
            })
        });
        let json = await addReq.json();
        if (!addReq.status.toString().startsWith("2")) await retry(smallArr, json);
    }
    function retry(array, json) {
        console.intelliLog(`Error ${json.error.status} while adding songs: ${json.error.message}`, "error");
        return new Promise((resolve) => {
            setTimeout(async () => {
                errorCount++;
                resolve(await addSongs(array));
            }, 4000);
        })
    }
    for (let i = 0; i < songs.length; i += 95) await addSongs(songs.slice(i, i + 95));
    return returnVal;
}
},{}],2:[function(require,module,exports){
module.exports = async (token, playArray) => {
    const getUser = require("./getUserId");
    const createPlaylist = require("./createPlaylists");
    const getSongs = require("./fetchPlaylist");
    const setSongs = require("./addSongs");
    let userId = await getUser(token);
    if (userId) {
        console.intelliLog(`Fetched user ID: ${userId}`, "info");
        for (let item in playArray) {
            let playlistId = await createPlaylist(item, token, userId);
            if (playlistId) {
                console.intelliLog(`Created playlist ${playlistId}`, "success", item);
                let songsToAdd = await getSongs(token, playArray[item]);
                if (songsToAdd) {
                    console.intelliLog(`Fetched ${songsToAdd.length}`, "success", item);
                    let localLength = songsToAdd.filter(e => e.startsWith("spotify:local")).length ;
                    if (localLength !== 0) console.intelliLog(`It won't be possible to add ${localLength} local songs.`, "warning", item)
                    let songsResult = await setSongs(token, playlistId, songsToAdd.filter(e => !e.startsWith("spotify:local")));
                    songsResult ? console.intelliLog(`Added ${songsToAdd.length} songs`, "success", item) : console.intelliLog("Failed to add all the songs. Playlist might be incomplete.", "error", item);
                } else console.intelliLog(`Failed to fetch songs. The playlist will be empty.`, "error", item)
            } else console.intelliLog(`Failed to create playlist. Trying with the next playlist.`, "error", item);
        }
    } else console.intelliLog(`Failed to fetch User ID. The script won't continue`, "error");
}
},{"./addSongs":1,"./createPlaylists":3,"./fetchPlaylist":4,"./getUserId":7}],3:[function(require,module,exports){
module.exports = async (playlist, token, user) => {
    let tryCount = 0;
    async function createPlaylist() {
        tryCount++;
        if (tryCount > 5) return false;
        let createPlaylist = await fetch(`https://api.spotify.com/v1/users/${user}/playlists`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                "name": playlist,
                "description": `Backup`,
                "public": false
            })
        });
        let jsonResponse = await createPlaylist.json();
        if (createPlaylist.status.toString().startsWith("2")) return jsonResponse.uri.replace("spotify:playlist:", ""); else return await timeout(jsonResponse);
    }
    function timeout(json) {
        console.intelliLog(`Error ${json.error.status} while creating playlist: ${json.error.status}`, "error", playlist);
        return new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await createPlaylist());
            }, 4000);
        })
    }
    return await createPlaylist();
}
},{}],4:[function(require,module,exports){
module.exports = async (token, playlist) => {
    let trackArray = [];
    let errorCount = 0;
    async function fetchResult(link) {
        if (errorCount > 5) return false;
        let songs = await fetch(link, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        });
        let json = await songs.json();
        if (songs.status.toString().startsWith("2")) {
            for (let item of json.items) trackArray.push(item.track.uri);
            return ((json.next ?? "") !== "") ? await nextLoad(json.next, true) : trackArray;
        } else {
            errorCount++;
            await nextLoad(link, undefined, json);
        }
    }
    function nextLoad(link, smallWait, json) {
        if ((json ?? "") !== "") console.intelliLog(`Error ${json.error.status} while fetching playlist songs: ${json.error.message}`, "error");
        return new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await fetchResult(link));
            }, smallWait ? 50 : 4000);
        })
    }
    return await fetchResult(`https://api.spotify.com/v1/playlists/${playlist}/tracks?limit=50`);
}
},{}],5:[function(require,module,exports){
module.exports = async(token, id) => {
    let numberTried = 0;
    async function getPlaylistDetail() {
        numberTried++;
        if (numberTried > 5) return false;
        let getInfo = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        });
        let json = await getInfo.json();
        return getInfo.status.toString().startsWith("2") ? {arr: [{name: json.name, img: json.images[0].url, id: json.id}]} : await retry();
    }
    function retry() {
        return new Promise((resolve) => {
            setTimeout(async () => {resolve(await getPlaylistDetail())}, 4000);
        })
    }
    return await getPlaylistDetail();
}
},{}],6:[function(require,module,exports){
module.exports = async (url, token) => {
    let triedTimes = 0;
    async function startFetch() {
        triedTimes++;
        if (triedTimes > 5) return false;
        let req = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        });
        let json = await req.json();
        if (req.status.toString().startsWith("2")) {
            let formattedItems = { next: json.next, arr: [] };
            for (let item of json.items) formattedItems.arr.push({ id: item.id, img: item.images[0].url, name: item.name });
            return formattedItems;
        } else return await timeout();
    }
    function timeout() {
        return new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await startFetch());
            }, 4000);
        })
    }
    return await startFetch();
}
},{}],7:[function(require,module,exports){
module.exports = async (token) => {
    let maxTry = 0;
    async function getUser() {
        maxTry++;
        if (maxTry > 5) return false;
        let api = await fetch(`https://api.spotify.com/v1/me`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        });
        let json = await api.json();
        return api.status.toString().startsWith("2") ? json.uri.replace("spotify:user:", "") : await retry(json);
    }
    function retry(json) {
        console.intelliLog(`Error ${json.error.status} while getting User ID: ${json.error.message}`, "error");
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(getUser());
            }, 4000)
        })
    }
    return await getUser();
}
},{}],8:[function(require,module,exports){
async function start() {
    const fetchPlaylist = require("./js/fetchUserLib");
    const getPlaylist = require("./js/fetchPlaylistDetails");
    let token = window.location.hash.substring(window.location.hash.indexOf("access_token=")).replace("access_token=", "");
    token = token.substring(0, token.indexOf("&"));
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
}
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
start();
},{"./js/commonUsage":2,"./js/fetchPlaylistDetails":5,"./js/fetchUserLib":6}]},{},[8]);
