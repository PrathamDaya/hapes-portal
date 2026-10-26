const { authorized } = require('../lib/media-auth');

const GET_ACTIONS = new Set([
    'getCycleDoc', 'getFeelingsEntries', 'getDiaryEntries', 'getPeriodEntries', 'getNotes', 'getLeaderboard'
]);
const POST_TYPES = new Set([
    'gameScoreEntry', 'periodEntry', 'noteEntry', 'feelingsEntry', 'diaryEntry', 'replyEntry'
]);

function stringValue(value) {
    return typeof value === 'string' ? value : '';
}

function parseBody(request) {
    const body = request.body;
    if (body && typeof body === 'object' && !Buffer.isBuffer(body) && !(body instanceof URLSearchParams)) return body;
    const raw = Buffer.isBuffer(body) ? body.toString('utf8') : stringValue(body);
    if (!raw) return {};
    const contentType = stringValue(request.headers['content-type']);
    if (/application\/json|text\/plain/i.test(contentType) || /^\s*\{/.test(raw)) {
        try { return JSON.parse(raw); } catch (error) { return null; }
    }
    return Object.fromEntries(new URLSearchParams(raw));
}

function apiError(response, status, message, code) {
    return response.status(status).json({ status: 'error', ...(code ? { code } : {}), message });
}

module.exports = async function handler(request, response) {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (!['GET', 'POST'].includes(request.method)) {
        response.setHeader('Allow', 'GET, POST');
        return apiError(response, 405, 'Method not allowed.');
    }
    if (!authorized(request)) return apiError(response, 401, 'Unlock the shared portal to continue.', 'unauthorized');
    if (!process.env.GAS_URL || !process.env.GAS_SECRET) return apiError(response, 503, 'Google Apps Script proxy is not configured.');

    let target;
    try {
        target = new URL(process.env.GAS_URL);
        if (target.protocol !== 'https:' || target.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(target.pathname)) throw new Error('Invalid GAS_URL');
    } catch (error) {
        return apiError(response, 503, 'GAS_URL must be an HTTPS Apps Script /exec URL.');
    }

    try {
        let upstream;
        if (request.method === 'GET') {
            const action = stringValue(request.query?.action);
            if (!GET_ACTIONS.has(action)) return apiError(response, 400, 'Unsupported Apps Script action.');
            target.search = '';
            target.searchParams.set('action', action);
            target.searchParams.set('secret', process.env.GAS_SECRET);
            if (action === 'getLeaderboard' && request.query?.game) target.searchParams.set('game', stringValue(request.query.game).slice(0, 80));
            if (action === 'getPeriodEntries' && request.query?.user) target.searchParams.set('user', stringValue(request.query.user).slice(0, 40));
            if (action === 'getCycleDoc' && request.query?.since) target.searchParams.set('since', stringValue(request.query.since).slice(0, 24));
            upstream = await fetch(target, { method: 'GET', redirect: 'follow', cache: 'no-store' });
        } else {
            const body = parseBody(request);
            if (!body || typeof body !== 'object' || Array.isArray(body)) return apiError(response, 400, 'Invalid request body.');
            const serialized = JSON.stringify(body);
            if (serialized.length > 200000) return apiError(response, 413, 'Request is too large.');

            if (body.items || body.changes) {
                const payload = { ...body, secret: process.env.GAS_SECRET };
                upstream = await fetch(target, {
                    method: 'POST', redirect: 'follow', cache: 'no-store',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
            } else {
                const formType = stringValue(body.formType);
                if (!POST_TYPES.has(formType)) return apiError(response, 400, 'Unsupported Apps Script form.');
                const form = new URLSearchParams();
                for (const [key, value] of Object.entries(body)) {
                    if (key !== 'secret' && typeof value !== 'object' && value !== undefined && value !== null) form.set(key, String(value));
                }
                form.set('secret', process.env.GAS_SECRET);
                upstream = await fetch(target, {
                    method: 'POST', redirect: 'follow', cache: 'no-store',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body: form
                });
            }
        }

        const text = await upstream.text();
        let payload;
        try { payload = JSON.parse(text); }
        catch (error) { return apiError(response, 502, 'Apps Script returned an invalid response.'); }
        if (payload?.code === 'unauthorized') return apiError(response, 401, 'Apps Script rejected the proxy secret.', 'unauthorized');
        if (!upstream.ok) return apiError(response, 502, 'Apps Script could not complete the request.');
        return response.status(200).json(payload);
    } catch (error) {
        console.error('Apps Script proxy failed:', error);
        return apiError(response, 502, 'Could not reach Google Apps Script.');
    }
};
