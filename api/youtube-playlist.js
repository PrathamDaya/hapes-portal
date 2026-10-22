const PLAYLIST_ID = 'PLg0uQzBdgt9kA8APLHj-4DBmidDksJFGx';

module.exports = async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Method not allowed.' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return response.status(503).json({ error: 'YouTube playlist catalog is not configured.' });
    }

    const pageToken = typeof request.query?.pageToken === 'string' ? request.query.pageToken : '';
    if (pageToken.length > 512) {
        return response.status(400).json({ error: 'Invalid page token.' });
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', PLAYLIST_ID);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    try {
        const result = await fetch(url);
        if (!result.ok) {
            return response.status(502).json({ error: 'YouTube could not return the playlist.' });
        }

        const payload = await result.json();
        const items = (payload.items || []).map(item => {
            const snippet = item.snippet || {};
            const id = item.contentDetails?.videoId || snippet.resourceId?.videoId;
            if (!id) return null;
            const thumbnails = snippet.thumbnails || {};
            return {
                id,
                title: snippet.title || '',
                author: snippet.videoOwnerChannelTitle || snippet.channelTitle || '',
                thumbnail: thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url || thumbnails.medium?.url || `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`
            };
        }).filter(Boolean);

        response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
        return response.status(200).json({
            items,
            totalResults: Number(payload.pageInfo?.totalResults) || items.length,
            nextPageToken: payload.nextPageToken || null
        });
    } catch (error) {
        return response.status(502).json({ error: 'Could not reach the YouTube playlist service.' });
    }
};
