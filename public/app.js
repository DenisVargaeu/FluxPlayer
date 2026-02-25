let allSongs = [];
let filteredSongs = [];
let currentPlaylist = [];
let currentIndex = -1;
let isPlaying = false;
let progressInterval = null;
let currentDuration = 0;
let currentTime = 0;
let currentPlayingFile = null;

async function loadSongs() {
  const res = await fetch("/songs");
  allSongs = await res.json();
  sortLibrary(); // Initial sort and render
}

function renderSongs(songs) {
  const box = document.getElementById("songs-list");
  box.innerHTML = "";
  songs.forEach(s => {
    const card = document.createElement("div");
    card.className = "song-card";

    // Deletion button
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSong(s.filename);
    };

    const art = document.createElement("div");
    art.className = "card-art";
    art.onclick = () => addToPlaylist(s.filename);

    if (s.picture) {
      const img = document.createElement("img");
      img.src = `data:${s.picture.format};base64,${s.picture.data}`;
      art.appendChild(img);
    } else {
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-music";
      art.appendChild(icon);
    }

    const titleInfo = document.createElement("div");
    titleInfo.className = "card-info-box";
    titleInfo.onclick = () => addToPlaylist(s.filename);

    const title = document.createElement("div");
    title.className = "card-title";
    title.innerText = s.title;

    const artist = document.createElement("div");
    artist.className = "card-artist";
    artist.innerText = s.artist;

    titleInfo.appendChild(title);
    titleInfo.appendChild(artist);

    card.appendChild(delBtn);
    card.appendChild(art);
    card.appendChild(titleInfo);
    box.appendChild(card);
  });
  document.getElementById('library-count').innerText = `${songs.length} songs`;
}

async function deleteSong(filename) {
  if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
  const res = await fetch("/songs/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename })
  });
  if (res.ok) {
    loadSongs();
    loadPlaylist();
  }
}

function filterSongs() {
  const query = document.getElementById('search-input').value.toLowerCase();
  filteredSongs = allSongs.filter(s =>
    s.title.toLowerCase().includes(query) ||
    s.artist.toLowerCase().includes(query) ||
    s.filename.toLowerCase().includes(query)
  );
  renderSongs(filteredSongs);
}

function sortLibrary() {
  const sortBy = document.getElementById('sort-select').value;
  const listToSort = document.getElementById('search-input').value ? filteredSongs : allSongs;

  listToSort.sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'newest') return -1; // Simulated newest for now
    return 0;
  });

  renderSongs(listToSort);
}

async function loadPlaylist() {
  const res = await fetch("/playlist");
  const data = await res.json();
  currentPlaylist = data.playlist;
  currentIndex = data.currentIndex;

  document.getElementById('shuffle-btn').classList.toggle('active', data.shuffle);
  document.getElementById('repeat-btn').classList.toggle('active', data.repeat);

  const box = document.getElementById("playlist-list");
  box.innerHTML = "";

  currentPlaylist.forEach((filename, i) => {
    const songData = allSongs.find(s => s.filename === filename) || { title: filename, artist: 'Unknown' };
    const div = document.createElement("div");
    div.className = `playlist-item ${i === currentIndex ? 'active' : ''}`;
    div.draggable = true;

    div.innerHTML = `
            <div class="item-index">${i + 1}</div>
            <div class="item-info">
                <div class="card-title">${songData.title}</div>
                <div class="card-artist">${songData.artist}</div>
            </div>
            <div class="item-album">${songData.album || ''}</div>
            <div class="item-duration">${formatTime(songData.duration)}</div>
        `;

    div.onclick = () => playSpecific(i);
    div.ondragstart = e => e.dataTransfer.setData("index", i);
    div.ondrop = async e => {
      const from = e.dataTransfer.getData("index");
      const to = i;
      const list = [...currentPlaylist];
      const item = list.splice(from, 1)[0];
      list.splice(to, 0, item);
      await fetch("/playlist/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist: list })
      });
      loadPlaylist();
    };
    div.ondragover = e => e.preventDefault();
    box.appendChild(div);
  });

  if (currentIndex >= 0 && currentPlaylist[currentIndex]) {
    updateNowPlaying(currentPlaylist[currentIndex]);
  }
}

function updateNowPlaying(filename) {
  if (currentPlayingFile === filename) return;
  currentPlayingFile = filename;

  const song = allSongs.find(s => s.filename === filename);
  if (!song) return;

  currentDuration = song.duration || 0;
  currentTime = 0;

  const updateUI = (prefix = "") => {
    const trackEl = document.getElementById(prefix + 'track');
    const artistEl = document.getElementById(prefix + 'artist');
    if (trackEl) trackEl.innerText = song.title;
    if (artistEl) artistEl.innerText = song.artist;

    const artBox = document.getElementById(prefix + 'art');
    if (artBox) {
      artBox.innerHTML = "";
      if (song.picture) {
        const img = document.createElement("img");
        img.src = `data:${song.picture.format};base64,${song.picture.data}`;
        if (prefix === "fs-") {
          // Fullscreen art is an img tag directly in some versions, but here it's a div id="current-art"
          // Wait, index.html has <img src="" id="fs-art">
          document.getElementById('fs-art').src = img.src;
        } else {
          artBox.appendChild(img);
        }
      } else {
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-music";
        artBox.appendChild(icon);
        if (prefix === "fs-") document.getElementById('fs-art').src = "";
      }
    }
  };

  updateUI("");
  updateUI("fs-");

  if (song.picture) {
    document.getElementById('fs-bg').style.backgroundImage = `url(data:${song.picture.format};base64,${song.picture.data})`;
  } else {
    document.getElementById('fs-bg').style.backgroundImage = "none";
  }

  document.getElementById('total-time').innerText = formatTime(currentDuration);
}

async function addToPlaylist(song) {
  await fetch("/playlist/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song })
  });
  loadPlaylist();
}

async function playSpecific(index) {
  currentPlayingFile = null; // Force reset when explicitly selecting a song
  await fetch("/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index })
  });
  loadPlaylist();
  setPlayState(true);
}

async function togglePlay() {
  if (isPlaying) {
    await fetch("/pause", { method: "POST" });
    setPlayState(false);
  } else {
    if (currentIndex >= 0 && currentPlayingFile) {
      await fetch("/resume", { method: "POST" });
    } else {
      await fetch("/play", { method: "POST" });
    }
    setPlayState(true);
  }
}

async function stopMusic() {
  await fetch("/stop", { method: "POST" });
  setPlayState(false);
  currentTime = 0;
  document.getElementById('progress-fill').style.width = "0%";
  document.getElementById('current-time').innerText = "0:00";
}

function setPlayState(playing) {
  isPlaying = playing;
  const btn = document.getElementById('play-pause-btn');
  btn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
  document.querySelector('.player-bar .now-playing').classList.toggle('playing', playing);

  if (playing) {
    startProgress();
    animateVisualizer();
  } else {
    stopProgress();
  }
}

function animateVisualizer() {
  const bars = document.querySelectorAll('.fs-visualizer .bar');
  if (bars.length === 0) {
    const container = document.getElementById('fs-visualizer');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      container.appendChild(bar);
    }
  }

  function step() {
    if (!isPlaying) return;
    const bars = document.querySelectorAll('.fs-visualizer .bar');
    bars.forEach(bar => {
      const height = Math.random() * 100;
      bar.style.height = height + "%";
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function startProgress() {
  stopProgress();
  progressInterval = setInterval(() => {
    if (currentDuration > 0) {
      currentTime++;
      const percent = (currentTime / currentDuration) * 100;
      document.getElementById('progress-fill').style.width = percent + "%";
      document.getElementById('current-time').innerText = formatTime(currentTime);
      if (currentTime >= currentDuration) stopProgress();
    }
  }, 1000);
}

function stopProgress() {
  if (progressInterval) clearInterval(progressInterval);
}

async function next() {
  currentPlayingFile = null;
  await fetch("/next", { method: "POST" });
  loadPlaylist();
  setPlayState(true);
}

async function prev() {
  currentPlayingFile = null;
  await fetch("/prev", { method: "POST" });
  loadPlaylist();
  setPlayState(true);
}

async function toggleShuffle() {
  const res = await fetch("/toggleShuffle", { method: "POST" });
  const data = await res.json();
  document.getElementById('shuffle-btn').classList.toggle('active', data.shuffle);
}

async function toggleRepeat() {
  const res = await fetch("/toggleRepeat", { method: "POST" });
  const data = await res.json();
  document.getElementById('repeat-btn').classList.toggle('active', data.repeat);
}

async function volume(v) {
  await fetch("/volume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level: v })
  });
}

function toggleFullscreen() {
  const overlay = document.getElementById('fullscreen-overlay');
  overlay.classList.toggle('active');
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('dexplayer-theme', theme);
}

async function upload() {
  const fileInput = document.getElementById("file-upload");
  const file = fileInput.files[0];
  if (!file) return;
  const form = new FormData();
  form.append("song", file);
  const btn = document.querySelector('.upload-section .btn-primary');
  const originalText = btn.innerText;
  btn.innerText = "Uploading...";
  await fetch("/upload", { method: "POST", body: form });
  btn.innerText = originalText;
  fileInput.value = "";
  loadSongs();
}

function showSection(section) {
  document.getElementById('library-section').style.display = section === 'library' ? 'block' : 'none';
  document.getElementById('playlist-section').style.display = section === 'playlist' ? 'block' : 'none';
  document.getElementById('settings-section').style.display = section === 'settings' ? 'block' : 'none';

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    // More robust active state check
    const itemText = item.innerText.toLowerCase();
    if (section === 'library' && itemText.includes('library')) item.classList.add('active');
    if (section === 'playlist' && itemText.includes('playlist')) item.classList.add('active');
    if (section === 'settings' && itemText.includes('settings')) item.classList.add('active');
  });
}

// Settings & PIN Logic
function openSettings() {
  document.getElementById('pin-modal').style.display = 'flex';
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-error').style.display = 'none';
  document.getElementById('pin-input').focus();
}

function closePinModal() {
  document.getElementById('pin-modal').style.display = 'none';
}

async function verifyPin() {
  const pin = document.getElementById('pin-input').value;
  const res = await fetch("/api/verify-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin })
  });

  if (res.ok) {
    closePinModal();
    showSection('settings');
    await loadSettings();
  } else {
    document.getElementById('pin-error').style.display = 'block';
  }
}

async function loadSettings() {
  const res = await fetch("/api/settings");
  const settings = await res.json();

  document.getElementById('theme-mode').value = settings.theme || 'system';
  document.getElementById('player-name-input').value = settings.playerName || 'FluxPlayer';
  document.getElementById('autoplay-checkbox').checked = settings.autoplay || false;

  applyThemeMode(settings.theme || 'system');
}

async function updateSettings() {
  const settings = {
    theme: document.getElementById('theme-mode').value,
    playerName: document.getElementById('player-name-input').value,
    autoplay: document.getElementById('autoplay-checkbox').checked,
    accent: document.body.getAttribute('data-theme') || 'blue'
  };

  await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings)
  });

  applyThemeMode(settings.theme);
}

function applyThemeMode(mode) {
  if (mode === 'dark') {
    document.documentElement.style.filter = '';
    document.body.classList.remove('light-theme');
  } else if (mode === 'light') {
    document.body.classList.add('light-theme');
  } else {
    // System
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }
}

function openChangePin() {
  document.getElementById('change-pin-modal').style.display = 'flex';
  document.getElementById('old-pin-input').value = '';
  document.getElementById('new-pin-input').value = '';
  document.getElementById('change-pin-error').style.display = 'none';
}

function closeChangePinModal() {
  document.getElementById('change-pin-modal').style.display = 'none';
}

async function updatePin() {
  const oldPin = document.getElementById('old-pin-input').value;
  const newPin = document.getElementById('new-pin-input').value;

  if (newPin.length !== 4) {
    const err = document.getElementById('change-pin-error');
    err.innerText = "New PIN must be 4 digits.";
    err.style.display = 'block';
    return;
  }

  const res = await fetch("/api/update-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPin, newPin })
  });

  if (res.ok) {
    closeChangePinModal();
    alert("PIN updated successfully.");
  } else {
    const err = document.getElementById('change-pin-error');
    err.innerText = "Incorrect current PIN.";
    err.style.display = 'block';
  }
}

// Add enter key support for PIN
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (document.getElementById('pin-modal').style.display === 'flex') {
      verifyPin();
    } else if (document.getElementById('change-pin-modal').style.display === 'flex') {
      updatePin();
    }
  }
});

async function clearPlaylist() {
  if (!confirm("Are you sure you want to clear the playlist?")) return;
  await fetch("/playlist/clear", { method: "POST" });
  currentPlayingFile = null;
  loadPlaylist();
  stopMusic();
}

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function init() {
  const savedTheme = localStorage.getItem('dexplayer-theme');
  if (savedTheme) setTheme(savedTheme);

  // Load initial settings to apply theme mode (light/dark/system)
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const settings = await res.json();
      applyThemeMode(settings.theme || 'system');
    }
  } catch (e) {
    console.log("Settings not loaded yet");
  }

  await loadSongs();
  await loadPlaylist();
}

init();
