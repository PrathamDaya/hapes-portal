const crypto = require('crypto');

const COOKIE_NAME = 'hetu_media_session';
const WEEK_SECONDS = 60 * 60 * 24 * 7;

function signature(expires, secret) {
    return crypto.createHmac('sha256', secret).update(String(expires)).digest('base64url');
}

function cookieValue(header) {
    return String(header || '').split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE_NAME + '='))?.slice(COOKIE_NAME.length + 1) || '';
}

function authorized(request) {
    const secret = process.env.HETU_MEDIA_CODE;
    if (!secret) return false;
    const [expiresText, provided] = cookieValue(request.headers.cookie).split('.');
    const expires = Number(expiresText);
    if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || !provided) return false;
    const expected = signature(expiresText, secret);
    const providedBytes = Buffer.from(provided);
    const expectedBytes = Buffer.from(expected);
    return providedBytes.length === expectedBytes.length && crypto.timingSafeEqual(providedBytes, expectedBytes);
}

function issueSession(response, request) {
    const secret = process.env.HETU_MEDIA_CODE;
    const expires = Math.floor(Date.now() / 1000) + WEEK_SECONDS;
    const token = expires + '.' + signature(expires, secret);
    const secure = request.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    response.setHeader('Set-Cookie', COOKIE_NAME + '=' + token + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + WEEK_SECONDS + secure);
}

function checkCode(code) {
    const expected = process.env.HETU_MEDIA_CODE;
    if (!expected || typeof code !== 'string') return false;
    const left = Buffer.from(code);
    const right = Buffer.from(expected);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = { authorized, issueSession, checkCode };

