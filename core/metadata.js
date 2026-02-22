const { execSync } = require('child_process');
const path = require('path');

async function getMetadata(filePath) {
    let metadata = null;
    try {
        const { parseFile } = await import('music-metadata');
        metadata = await parseFile(filePath);
    } catch (error) {
        console.error(`music-metadata failed for ${filePath}:`, error.message);
    }

    const basename = path.basename(filePath, path.extname(filePath));
    let artist = 'Unknown Artist';
    let title = basename;

    if (basename.includes(' - ')) {
        const parts = basename.split(' - ');
        if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts[1].trim();
        }
    }

    let duration = 0;
    if (metadata && metadata.format && metadata.format.duration) {
        duration = metadata.format.duration;
    } else {
        // Fallback to ffprobe
        try {
            const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf-8' });
            duration = parseFloat(output) || 0;
        } catch (e) {
            console.error(`ffprobe failed for ${filePath}:`, e.message);
        }
    }

    return {
        title: (metadata && metadata.common && metadata.common.title) || title,
        artist: (metadata && metadata.common && metadata.common.artist) || artist,
        album: (metadata && metadata.common && metadata.common.album) || 'Unknown Album',
        duration: duration,
        picture: (metadata && metadata.common && metadata.common.picture) ? {
            format: metadata.common.picture[0].format,
            data: metadata.common.picture[0].data.toString('base64')
        } : null
    };
}

module.exports = { getMetadata };
