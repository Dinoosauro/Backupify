# Backupify
Create a duplicate of your Spotify playlists, easily both from Node.JS or a web interface.
## Web interface

Try it: https://dinoosauro.github.io/Backupify/

The Web Interface is an easy way to manage your playlists. After logging in with Spotify API, you'll be able to choose with a checkbox which playlist(s) to backup.
![image](https://github.com/Dinoosauro/Backupify/assets/80783030/7b9a570f-8199-4bea-b4a3-7c19fc56589f)

After this, click on the "Continue with the backup" button. You'll be asked to choose a name for these new playlists.
![image](https://github.com/Dinoosauro/Backupify/assets/80783030/7982f61d-6e73-4dc4-b422-fa6eb1e7f55e)

Now, you can start with the playlist backup. Click on the green button and the website will manage your backup. In a few seconds, everything'll be done!
![image](https://github.com/Dinoosauro/Backupify/assets/80783030/a88812b0-009f-4cce-9529-a4882e07c4e6)

## Command-line tool
You can run Backupify also from the command line, using Node.JS. Make sure to add your own Client ID in the ```console.js``` file. The script will automatically create a server on localhost, that'll be used for authenticating with Spotify API. Make sure to add ```http://localhost:15200/next.html``` as the Redirect URI in your Spotify console.
### Passing playlist with playlist.json
You can choose the playlists to duplicate by creating a ```playlist.json``` file. This JSON will need to contain the playlist ID as a key, and the name of the duplicate playlist as a value. For example
```
{
  "37i9dQZF1DXcBWIGoYBM5M": "Today's Top Hits",
  "37i9dQZF1DX4JAvHpjipBk": "New Music Friday"
}
```
### Passing playlist directly from the script
If you don't have a ```playlist.json``` file, the script will use the ```playlist``` object the ```clientOptions``` variable. You can add there playlist IDs and names by following the same syntax as a JSON file.
