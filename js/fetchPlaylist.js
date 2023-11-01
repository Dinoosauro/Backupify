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