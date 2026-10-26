const { del, get, list, put } = require('@vercel/blob');
const { authorized } = require('../lib/media-auth');
const crypto = require('crypto');

const PREFIX = 'hetu-memories/';
const SAFE_ID = /^[a-f0-9-]{36}$/i;
const MIME_EXTENSIONS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

async function readJson(pathname) {
    const result = await get(pathname, { access: 'private' });
    if (!result) return null;
    return new Response(result.stream).json();
}

function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + 'T00:00:00.000Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function listMemories() {
    const records = [];
    let cursor;
    for (let page = 0; page < 20; page += 1) {
        const result = await list({ prefix: PREFIX, limit: 1000, access: 'private', ...(cursor ? { cursor } : {}) });
        for (const blob of result.blobs || []) {
            if (!blob.pathname.endsWith('.json')) continue;
            try {
                const record = await readJson(blob.pathname);
                if (record?.id) records.push(record);
            } catch (error) {}
        }
        if (!result.hasMore || !result.cursor) break;
        cursor = result.cursor;
    }
    return records.sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt.localeCompare(b.updatedAt));
}

module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'private, no-store');
    if (!authorized(request)) return response.status(401).json({ error: 'Unlock shared memories to continue.' });
    if (!process.env.BLOB_READ_WRITE_TOKEN) return response.status(503).json({ error: 'Connect a private Vercel Blob store first.' });

    try {
        if (request.method === 'GET') return response.status(200).json({ memories: await listMemories() });
        const body = request.body && typeof request.body === 'object' ? request.body : {};
        const id = typeof body.id === 'string' && SAFE_ID.test(body.id) ? body.id : crypto.randomUUID();
        const metadataPath = PREFIX + id + '.json';
        if (request.method === 'DELETE') {
            const existing = await readJson(metadataPath);
            if (!existing) return response.status(404).json({ error: 'Memory not found.' });
            await del(metadataPath, { access: 'private' });
            if (existing.imagePath) await del(existing.imagePath, { access: 'private' });
            return response.status(200).json({ status: 'deleted' });
        }
        if (request.method !== 'POST') {
            response.setHeader('Allow', 'GET, POST, DELETE');
            return response.status(405).json({ error: 'Method not allowed.' });
        }

        const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
        const date = body.date;
        const desc = typeof body.desc === 'string' ? body.desc.trim().slice(0, 1200) : '';
        if (!title || !validDate(date)) return response.status(400).json({ error: 'Add a title and a valid memory date.' });

        const previous = await readJson(metadataPath);
        let imagePath = previous?.imagePath || '';
        if (body.imageData) {
            const extension = MIME_EXTENSIONS[body.mimeType];
            if (!extension || typeof body.imageData !== 'string' || body.imageData.length > 4200000) {
                return response.status(400).json({ error: 'Choose a supported photo smaller than 3 MB after resizing.' });
            }
            const buffer = Buffer.from(body.imageData, 'base64');
            if (!buffer.length || buffer.length > 3 * 1024 * 1024) return response.status(400).json({ error: 'Photo exceeds the 3 MB limit.' });
            const nextImagePath = PREFIX + id + '.' + extension;
            const image = await put(nextImagePath, buffer, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: body.mimeType });
            if (imagePath && imagePath !== image.pathname) await del(imagePath, { access: 'private' });
            imagePath = image.pathname;
        }

        const builtIn = /^assets\/Timeline\/[1-4]\.jpg$/.test(body.img || '') ? body.img : '';
        const record = {
            id, title, date, desc,
            img: imagePath ? '/api/memory-image?pathname=' + encodeURIComponent(imagePath) : (previous?.img || builtIn),
            imagePath: imagePath || null,
            shared: true,
            by: body.by === 'Prath' ? 'Prath' : 'Chikoo',
            updatedAt: new Date().toISOString()
        };
        await put(metadataPath, JSON.stringify(record), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
        return response.status(200).json({ memory: record });
    } catch (error) {
        console.error('Shared memory API failed:', error);
        return response.status(500).json({ error: 'Could not save or load shared memories.' });
    }
};

