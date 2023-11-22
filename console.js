const http = require("http");
const open = require("open");
const logic = require("./js/commonUsage");
let clientOptions = {
    connect: { // Custom options tied to Spotify API Login
        api: "YOUR_CLIENT_ID", // Client ID
        port: 15200, // Localhost port
    },
    playlists: {} // Write as a key the playlist ID, and as a string value of that key the name of the new playlist
}
clientOptions.playlists = JSON.parse(require("fs").readFileSync("playlist.json", "utf-8")); // If there's a playlist.json file, use that instead of the playlist written in this script.
console.intelliLog = (msg, type, item) => {  // The function that informs the user about the progress
    let symbolRef = { // Info gravity -> Emoji
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        error: "❌"
    }
    console.log(`${symbolRef[type]} | ${msg}${(item ?? "") !== "" ? ` | ${item}` : ""}`); // Write it into the console
 };
let server = http.createServer(async (req, res) => { // Create server
    if (req.url.startsWith("/token")) { // Successful redirect with the token
        res.end("<!DOCTYPE html><body><h1>You can close this window.</h1></body>");
        server.close();
        server.closeAllConnections();
        let fetchToken = req.url.substring(req.url.indexOf("access_token=")).replace("access_token=", ""); // Get token from the URL
        fetchToken = fetchToken.substring(0, fetchToken.indexOf("&"));
        await logic(fetchToken, clientOptions.playlists); // Start duplicating the playlists
    } else res.end(`<!DOCTYPE html><body><h1>Please enable JavaScript</h1><script>if (window.location.hash.substring(1).indexOf("access_token=") !== -1) window.location.href = \`http://localhost:${clientOptions.connect.port}/token=\${window.location.hash.substring(1)}\`</script></body>`); // Write a script that gets the hash and adds it to the normal URL, so that Node can get it
});
server.listen(clientOptions.connect.port, "localhost", () => { // Start server, and open the authentication URL
    open(`https://accounts.spotify.com/authorize?client_id=${clientOptions.connect.api}&response_type=token&redirect_uri=${encodeURIComponent(`http://localhost:${clientOptions.connect.port}/login.html`)}&scope=playlist-read-private%20playlist-modify-private`);
});
