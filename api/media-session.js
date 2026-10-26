const { checkCode, issueSession } = require('../lib/media-auth');

module.exports = function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).json({ error: 'Method not allowed.' });
    }
    if (!process.env.HETU_MEDIA_CODE) {
        return response.status(503).json({ error: 'Shared photo access is not configured yet.' });
    }
    if (!checkCode(request.body?.code)) {
        return response.status(401).json({ error: 'That shared space code is not correct.' });
    }
    issueSession(response, request);
    return response.status(200).json({ status: 'ok' });
};

