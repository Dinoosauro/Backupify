const http = require("http");
const open = require("open");
const logic = require("./js/commonUsage");
let clientOptions = {
    connect: {
        api: "7308cf166d594bc79eadf9a2a8fc643b", // Client ID
        port: 15200, // Localhost port
    },
    playlists: {}
}
clientOptions.playlists = JSON.parse(require("fs").readFileSync("playlist.json", "utf-8"));
console.intelliLog = (msg, type, item) => { 
    let symbolRef = {
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        error: "❌"
    }
    console.log(`${symbolRef[type]} | ${msg}${(item ?? "") !== "" ? ` | ${item}` : ""}`);
 };
let server = http.createServer(async (req, res) => {
    if (req.url.startsWith("/token")) {
        res.end("<!DOCTYPE html><body><h1>You can close this window.</h1></body>");
        server.close();
        server.closeAllConnections();
        let fetchToken = req.url.substring(req.url.indexOf("access_token=")).replace("access_token=", "");
        fetchToken = fetchToken.substring(0, fetchToken.indexOf("&"));
        await logic(fetchToken, clientOptions.playlists);
    } else res.end(`<!DOCTYPE html><body><h1>Please enable JavaScript</h1><script>if (window.location.hash.substring(1).indexOf("access_token=") !== -1) window.location.href = \`http://localhost:${clientOptions.connect.port}/token=\${window.location.hash.substring(1)}\`</script></body>`);
});
server.listen(clientOptions.connect.port, "localhost", () => {
    open(`https://accounts.spotify.com/authorize?client_id=${clientOptions.connect.api}&response_type=token&redirect_uri=${encodeURIComponent(`http://localhost:${clientOptions.connect.port}/login.html`)}&scope=playlist-read-private%20playlist-modify-private`);
});
