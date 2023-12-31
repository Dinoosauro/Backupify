let theme = { // The theme object, with the hexadecimal values of the colors
    applied: "dark",
    dark: {
        background: "#151515",
        text: "#f0f0f0",
        firstcontent: "#323232",
        secondcontent: "#505050",
        accent: "#228b45"
    }, light: {
        background: "#f0f0f0",
        text: "#151515",
        firstcontent: "#c8c8c8",
        secondcontent: "#a0a0a0",
        accent: "#48e57d"
    }
}
function applyTheme(type) { // Change default theme
    theme.applied = type;
    for (let item in theme[type]) document.documentElement.style.setProperty(`--${item}`, theme[type][item]);
    localStorage.setItem("Backupify-Theme", type); // Store the new theme
}
(localStorage.getItem("Backupify-Theme") ?? "") !== "" ? applyTheme(localStorage.getItem("Backupify-Theme")) : window.matchMedia(' (prefers-color-scheme: dark)').matches ? applyTheme("dark") : applyTheme("light"); // If there's a custom theme saved, apply it. Otherwise, use browser's default settings.
let changeTheme = document.createElement("l"); // Create a label to change theme
changeTheme.classList.add("bottomClick");
changeTheme.textContent = "Change theme";
changeTheme.addEventListener("click", () => {
    applyTheme(theme.applied === "dark" ? "light" : "dark");
})
function opacityRemove(div) { // Add an opacity transition: from 1 to 0
    return new Promise((resolve) => {
        div.style.opacity = 0;
        setTimeout(() => {
            div.style.display = "none";
            resolve("");
        }, 270);
    })
}
function opacityAdd(div, type) { // Add an opacity transition: from 0 to 1
    return new Promise((resolve) => {
        div.style.display = type ?? "block";
        setTimeout(() => {
            div.style.opacity = 1;
            setTimeout(() => resolve(), 255);
        }, 15);
    })
}
// The dialog that'll contain privacy info
let privacyContainer = document.createElement("div"); 
privacyContainer.classList.add("dialogContainer");
let privacy = document.createElement("div");
privacy.classList.add("dialog");
let h2 = document.createElement("h2");
h2.textContent = "Privacy notice";
let privacyText = document.createElement("l");
privacyText.style.whiteSpace = "pre-line";
privacyText.textContent = "Backupify does collect the mininum data necessary to make it work. Every connection to the Spotify API is done locally on your device, an the application doesn't send any other data to external servers.\n\nThe theme preference, and the recent playlist ID if enabled, might be saved locally on the device's LocalStorage. These data always stay on your device.\n\nTo fetch the font used by this website, Backupify connects to Google Fonts. No data is shared with Google.";
let closePrivacy = document.createElement("button");
closePrivacy.textContent = "Close dialog";
closePrivacy.addEventListener("click", () => {opacityRemove(privacyContainer)});
privacy.append(h2, privacyText, document.createElement("br"), document.createElement("br"), closePrivacy, document.createElement("br"), document.createElement("br"));
privacyContainer.append(privacy);
document.body.append(privacyContainer);
// The label that'll permit the user to read privacy info
let privacyClick = document.createElement("l");
privacyClick.classList.add("bottomClick");
privacyClick.textContent = "Privacy notice";
privacyClick.addEventListener("click", () => {opacityAdd(privacyContainer, "flex")});
// Add info about Spotify trademark
let spotifyTrademark = document.createElement("l");
spotifyTrademark.textContent = "Spotify and the Spotify logo are trademark of Spotify, that is not affiliated in any way with Backupify."
document.body.append(document.createElement("br"), document.createElement("br"), document.createElement("br"), spotifyTrademark, document.createElement("br"), document.createElement("br"), changeTheme, privacyClick);