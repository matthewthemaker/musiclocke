import { MOCK_TRACKS } from "../data/mockTracks.js";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const MUSIC_CATEGORY_ID = "10";

/**
 * Normalizes a YouTube search result item into the shape the rest of the
 * app expects (matches the fields used by MOCK_TRACKS).
 */
function normalizeYouTubeItem(item, index) {
  const snippet = item.snippet ?? {};
  const thumb =
    snippet.thumbnails?.high?.url ??
    snippet.thumbnails?.medium?.url ??
    snippet.thumbnails?.default?.url ??
    "";

  return {
    id: `yt-${item.id?.videoId ?? index}`,
    videoId: item.id?.videoId ?? "",
    title: snippet.title ?? "Untitled",
    artist: snippet.channelTitle ?? "Unknown Artist",
    album: "YouTube",
    duration: 0, // YouTube search endpoint doesn't return duration; a follow-up
    // call to videos.list(part=contentDetails) would be required for exact runtime.
    thumbnail: thumb,
    color: ["purple", "green", "amber", "pink"][index % 4],
    lyrics: [],
    diary: "",
    credits: [{ role: "Channel", name: snippet.channelTitle ?? "Unknown" }],
    source: "youtube",
  };
}

/**
 * Searches YouTube Music-category videos for a query. Falls back to the
 * local mock catalog (filtered by the same query) if no API key is
 * configured, the request fails, or the network is unavailable — so the
 * app always feels complete, even offline.
 */
export async function searchTracks(query) {
  const trimmed = query?.trim();

  if (!trimmed) {
    return { results: MOCK_TRACKS, source: "mock" };
  }

  if (!API_KEY) {
    return { results: filterMock(trimmed), source: "mock" };
  }

  try {
    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoCategoryId", MUSIC_CATEGORY_ID);
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("key", API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API responded with ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      return { results: filterMock(trimmed), source: "mock" };
    }

    return { results: items.map(normalizeYouTubeItem), source: "youtube" };
  } catch (error) {
    console.warn("[MusicLocke] YouTube search failed, using local catalog:", error.message);
    return { results: filterMock(trimmed), source: "mock" };
  }
}

function filterMock(query) {
  const lower = query.toLowerCase();
  const filtered = MOCK_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      t.artist.toLowerCase().includes(lower) ||
      t.album.toLowerCase().includes(lower)
  );
  return filtered.length > 0 ? filtered : MOCK_TRACKS;
}

export function hasApiKey() {
  return Boolean(API_KEY);
}
