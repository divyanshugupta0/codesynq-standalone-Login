const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024;
const FUNCTION_PATH = '/.netlify/functions/firebase-auth-proxy';
const AUTH_PATH_PREFIX = '/__/auth/';

function response(statusCode, body, headers = {}) {
    return { statusCode, headers, body };
}

exports.handler = async function(event) {
    const method = String(event.httpMethod || 'GET').toUpperCase();
    if (!['GET', 'POST', 'OPTIONS'].includes(method)) {
        return response(405, 'Method not allowed.', { Allow: 'GET, POST, OPTIONS' });
    }
    if (method === 'OPTIONS') {
        return response(204, '', {
            'Access-Control-Allow-Origin': event.headers?.origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': event.headers?.['access-control-request-headers'] || 'Content-Type',
            'Access-Control-Max-Age': '600',
        });
    }

    const authDomain = String(process.env.FIREBASE_AUTH_DOMAIN || '').trim();
    if (!authDomain || !/^[a-z0-9.-]+$/i.test(authDomain)) {
        console.error('FIREBASE_AUTH_DOMAIN is missing or invalid.');
        return response(500, 'Firebase authentication is not configured.');
    }

    const path = String(event.path || '');
    const functionPrefix = `${FUNCTION_PATH}/`;
    if (!path.startsWith(functionPrefix)) {
        return response(404, 'Not found.');
    }
    const pathSuffix = path.slice(functionPrefix.length);
    if (!pathSuffix || pathSuffix.split('/').some(segment => segment === '.' || segment === '..') || pathSuffix.includes('\\')) {
        return response(404, 'Not found.');
    }
    const authPath = `${AUTH_PATH_PREFIX}${pathSuffix}`;

    let requestBody;
    if (event.body) {
        requestBody = event.isBase64Encoded
            ? Buffer.from(event.body, 'base64')
            : Buffer.from(event.body, 'utf8');
        if (requestBody.length > MAX_REQUEST_BYTES) {
            return response(413, 'Authentication request is too large.');
        }
    }

    const upstreamUrl = new URL(`https://${authDomain}${authPath}`);
    if (event.rawQuery) upstreamUrl.search = String(event.rawQuery).replace(/^\?/, '');
    else if (event.queryStringParameters) {
        upstreamUrl.search = new URLSearchParams(event.queryStringParameters).toString();
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(event.headers || {})) {
        const key = name.toLowerCase();
        if (['host', 'connection', 'content-length', 'accept-encoding'].includes(key) || value == null) continue;
        headers.set(key, String(value));
    }
    headers.set('Accept-Encoding', 'identity');

    let upstream;
    try {
        upstream = await fetch(upstreamUrl, {
            method,
            headers,
            body: method === 'POST' ? requestBody : undefined,
            redirect: 'manual',
        });
    } catch (error) {
        console.error('Firebase authentication proxy request failed:', error.message);
        return response(502, 'Firebase authentication service is unavailable.');
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    if (body.length > MAX_RESPONSE_BYTES) {
        return response(502, 'Firebase authentication response is too large.');
    }

    const responseHeaders = {};
    upstream.headers.forEach((value, name) => {
        const key = name.toLowerCase();
        if (['connection', 'content-length', 'content-encoding', 'transfer-encoding'].includes(key)) return;
        responseHeaders[name] = value;
    });

    return {
        statusCode: upstream.status,
        headers: responseHeaders,
        body: body.toString('base64'),
        isBase64Encoded: true,
    };
};
