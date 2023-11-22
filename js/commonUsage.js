module.exports = async (token, playArray) => {
    const getUser = require("./getUserId");
    const createPlaylist = require("./createPlaylists");
    const getSongs = require("./fetchPlaylist");
    const setSongs = require("./addSongs");
    let userId = await getUser(token);
    if (userId) { // Valid response
        console.intelliLog(`Fetched user ID: ${userId}`, "info");
        for (let item in playArray) { // For each playlist...
            let playlistId = await createPlaylist(item, token, userId);
            if (playlistId) {
                console.intelliLog(`Created playlist ${playlistId}`, "success", item);
                let songsToAdd = await getSongs(token, playArray[item]);
                if (songsToAdd) { // Valid response
                    console.intelliLog(`Fetched ${songsToAdd.length}`, "success", item);
                    let localLength = songsToAdd.filter(e => e.startsWith("spotify:local")).length; // Get the local songs, that won't be added to the playlist due to Spotify API restrictions.
                    if (localLength !== 0) console.intelliLog(`It won't be possible to add ${localLength} local songs.`, "warning", item);
                    let songsResult = await setSongs(token, playlistId, songsToAdd.filter(e => !e.startsWith("spotify:local"))); // Skip local songs since they are unsupported by Spotify API
                    songsResult ? console.intelliLog(`Added ${songsToAdd.length} songs`, "success", item) : console.intelliLog("Failed to add all the songs. Playlist might be incomplete.", "error", item);
                } else console.intelliLog(`Failed to fetch songs. The playlist will be empty.`, "error", item)
            } else console.intelliLog(`Failed to create playlist. Trying with the next playlist.`, "error", item);
        }
    } else console.intelliLog(`Failed to fetch User ID. The script won't continue`, "error");
}