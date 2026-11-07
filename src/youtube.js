const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY?.trim();
export const hasYouTubeApiKey = Boolean(YOUTUBE_API_KEY);

function friendlyDate(value) {
  if (!value) return 'Recently';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export async function searchYouTubeVideos(query, signal) {
  if (!YOUTUBE_API_KEY) throw new Error('NO_API_KEY');

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.search = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '12',
    videoEmbeddable: 'true'
  });

  const response = await fetch(url, { signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiMessage = payload?.error?.message;
    throw new Error(apiMessage || `YouTube API request failed (${response.status}).`);
  }

  return (payload.items || []).flatMap((item) => {
    const id = item.id?.videoId;
    const snippet = item.snippet;
    if (!id || !snippet) return [];
    const title = snippet.title || 'Untitled video';
    return [{
      id,
      title,
      channel: snippet.channelTitle || 'YouTube creator',
      views: 'YouTube video',
      age: friendlyDate(snippet.publishedAt),
      duration: '',
      category: 'YouTube',
      image: 'photo-1500530855697-b586d89ba3ee',
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      avatar: (snippet.channelTitle || 'Y').slice(0, 1).toUpperCase(),
      tone: 'violet',
      verified: false,
      source: 'youtube-api'
    }];
  });
}
