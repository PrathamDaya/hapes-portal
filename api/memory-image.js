const { Readable } = require('node:stream');
const { get } = require('@vercel/blob');
const { authorized } = require('../lib/media-auth');
module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET') { response.setHeader('Allow', 'GET'); return response.status(405).end('Method not allowed.'); }
    if (!authorized(request)) return response.status(401).end('Unlock shared memories to view this photo.');
    const pathname = request.query?.pathname;
    if (typeof pathname !== 'string' || !pathname.startsWith('hetu-memories/') || pathname.endsWith('.json') || pathname.includes('..')) return response.status(400).end('Invalid photo path.');
    try {
        const result = await get(pathname, { access: 'private', ifNoneMatch: request.headers['if-none-match'] });
        if (!result) return response.status(404).end('Photo not found.');
        if (result.statusCode === 304) return response.status(304).end();
        response.statusCode = 200; response.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream'); response.setHeader('ETag', result.blob.etag);
        const stream = result.stream?.getReader ? Readable.fromWeb(result.stream) : result.stream;
        stream.on('error', () => response.destroy()); stream.pipe(response);
    } catch (error) { console.error('Private photo read failed:', error); if (!response.headersSent) response.status(404).end('Photo not found.'); }
};

