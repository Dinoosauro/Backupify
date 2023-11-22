// Async function that gets the playlists in the user library. A URL must be provided, so that also further playlist can later be fetched.
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
            return { next: json.next, arr: json.items.map(e => {return {id: e.id, img: e.images[0].url, name: e.name}}) }; // Return only the necessary fields: ID, Image, Playlist Name
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