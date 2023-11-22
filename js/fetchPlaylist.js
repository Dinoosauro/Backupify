// Get songs in a playlists
module.exports = async (token, playlist) => {
    let trackArray = [];
    let errorCount = 0;
    async function fetchResult(link) { // Send a fetch request to a Spotify URL, and then add to the array of tracks the new songs
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
            trackArray.push(...json.items.map(e => {return e.track.uri})); // Add to the items only the track URI
            return ((json.next ?? "") !== "") ? await nextLoad(json.next, true) : trackArray; // If there is a "next" field, fetch it. Otherwise, return the new track array.
        } else {
            errorCount++;
            await nextLoad(link, undefined, json);
        }
    }
    function nextLoad(link, smallWait, json) { // Wait a few seconds before retrying. If the operation was successful, only a 50 millisecond delay will be added.
        if ((json ?? "") !== "") console.intelliLog(`Error ${json.error.status} while fetching playlist songs: ${json.error.message}`, "error");
        return new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await fetchResult(link));
            }, smallWait ? 50 : 4000);
        })
    }
    return await fetchResult(`https://api.spotify.com/v1/playlists/${playlist}/tracks?limit=50`);
}