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