// Async function that returns the User ID
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