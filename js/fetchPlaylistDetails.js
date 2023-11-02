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