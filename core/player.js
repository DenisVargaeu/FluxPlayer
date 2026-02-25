const { spawn } = require("child_process");
const net = require("net");
const fs = require("fs");

const SOCKET = "/tmp/dexplayer.sock";

let mpv = null;

function start() {
    if (mpv) return;

    if (fs.existsSync(SOCKET)) fs.unlinkSync(SOCKET);

    mpv = spawn("mpv", [
        "--no-video",
        "--idle=yes",
        `--input-ipc-server=${SOCKET}`
    ]);

    mpv.on("exit", () => mpv = null);
}

function send(command, retries = 10) {
    return new Promise((resolve, reject) => {
        function attempt(remaining) {
            const client = net.createConnection(SOCKET);

            client.on("connect", () => {
                client.write(JSON.stringify({ command }) + "\n");
            });

            client.on("data", data => {
                resolve(data.toString());
                client.destroy();
            });

            client.on("error", err => {
                client.destroy();
                if (remaining > 0) {
                    setTimeout(() => attempt(remaining - 1), 200);
                } else {
                    reject(new Error(`mpv socket not available: ${err.message}`));
                }
            });
        }
        attempt(retries);
    });
}

module.exports = {
    init() { start(); },
    play(file) { return send(["loadfile", file]); },
    setPause(state) { return send(["set_property", "pause", state]); },
    stop() { return send(["stop"]); },
    volume(v) { return send(["set_property", "volume", v]); },
    next() { return send(["playlist-next"]); },
    prev() { return send(["playlist-prev"]); }
};
