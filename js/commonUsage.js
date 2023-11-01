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