// Send a POST request to the Spotify API to create a new playlist
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
        if (createPlaylist.status.toString().startsWith("2")) return jsonResponse.uri.replace("spotify:playlist:", ""); else return await timeout(jsonResponse); // If the response was successful, return the new playlist id, otherwise try again
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