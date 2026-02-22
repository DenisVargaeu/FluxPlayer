const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const player = require("./core/player");
const { getMetadata } = require("./core/metadata");

const app = express();
const PORT = 7763;

app.use(express.json());
app.use(express.static("public"));

const MUSIC_DIR = path.join(__dirname, "music");
const PLAYLIST_FILE = path.join(__dirname, "playlist.json");

if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR);
if (!fs.existsSync(PLAYLIST_FILE)) fs.writeFileSync(PLAYLIST_FILE, "[]");

let playlist = JSON.parse(fs.readFileSync(PLAYLIST_FILE));
let currentIndex = 0;
let shuffle = false;
let repeat = false;

player.init();

function savePlaylist() {
    fs.writeFileSync(PLAYLIST_FILE, JSON.stringify(playlist, null, 2));
}

const storage = multer.diskStorage({
    destination: MUSIC_DIR,
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.get("/songs", async (req, res) => {
    try {
        const files = fs.readdirSync(MUSIC_DIR)
            .filter(f => f.endsWith(".mp3") || f.endsWith(".flac") || f.endsWith(".m4a") || f.endsWith(".wav"));

        const songsWithMetadata = await Promise.all(files.map(async (file) => {
            const meta = await getMetadata(path.join(MUSIC_DIR, file));
            return {
                filename: file,
                ...meta
            };
        }));

        res.json(songsWithMetadata);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/upload", upload.single("song"), (req, res) => {
    res.json({ ok: true });
});

app.get("/playlist", (req, res) => res.json({ playlist, currentIndex, shuffle, repeat }));

app.post("/playlist/add", (req, res) => {
    if (req.body && req.body.song) {
        playlist.push(req.body.song);
        savePlaylist();
    }
    res.json(playlist);
});

app.post("/playlist/reorder", (req, res) => {
    if (req.body && req.body.playlist) {
        playlist = req.body.playlist;
        savePlaylist();
    }
    res.json(playlist);
});

app.post("/play", async (req, res) => {
    if (playlist.length === 0) return res.json({ error: "empty" });

    if (req.body && req.body.index !== undefined) {
        currentIndex = req.body.index;
    } else if (currentIndex < 0) {
        currentIndex = 0;
    }

    const song = playlist[currentIndex];
    await player.play(path.join(MUSIC_DIR, song));
    await player.setPause(false);
    res.json({ playing: song, currentIndex });
});

app.post("/pause", async (_, res) => {
    await player.setPause(true);
    res.json({ ok: true });
});

app.post("/resume", async (_, res) => {
    await player.setPause(false);
    res.json({ ok: true });
});

app.post("/stop", async (_, res) => {
    await player.stop();
    res.json({ ok: true });
});

app.post("/next", async (_, res) => {
    if (playlist.length === 0) return res.json({ error: "empty" });

    if (shuffle) {
        currentIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentIndex++;
        if (currentIndex >= playlist.length) {
            if (repeat) currentIndex = 0;
            else currentIndex = playlist.length - 1;
        }
    }
    await player.play(path.join(MUSIC_DIR, playlist[currentIndex]));
    res.json({ playing: playlist[currentIndex], currentIndex });
});

app.post("/prev", async (_, res) => {
    if (playlist.length === 0) return res.json({ error: "empty" });

    currentIndex--;
    if (currentIndex < 0) currentIndex = 0;
    await player.play(path.join(MUSIC_DIR, playlist[currentIndex]));
    res.json({ playing: playlist[currentIndex], currentIndex });
});

app.post("/volume", async (req, res) => {
    if (req.body && req.body.level !== undefined) {
        await player.volume(req.body.level);
    }
    res.json({ ok: true });
});

app.post("/toggleShuffle", (req, res) => {
    shuffle = !shuffle;
    res.json({ shuffle });
});

app.post("/toggleRepeat", (req, res) => {
    repeat = !repeat;
    res.json({ repeat });
});

app.post("/playlist/clear", (req, res) => {
    playlist = [];
    currentIndex = 0;
    savePlaylist();
    player.stop();
    res.json({ ok: true, playlist });
});

app.post("/songs/delete", (req, res) => {
    if (req.body && req.body.filename) {
        const filePath = path.join(MUSIC_DIR, req.body.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            // Also remove from playlist if present
            playlist = playlist.filter(s => s !== req.body.filename);
            savePlaylist();
            return res.json({ ok: true });
        }
    }
    res.status(400).json({ error: "Invalid file" });
});

app.listen(PORT, () => console.log(`DexPlayer beží na ${PORT} 🚀`));
