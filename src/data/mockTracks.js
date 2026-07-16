// Local fallback catalog. Used whenever VITE_YOUTUBE_API_KEY is missing,
// the request fails, or the user is browsing offline. Thumbnails point to
// royalty-free placeholder art so the UI never breaks without network access.

export const MOCK_TRACKS = [
  {
    id: "ml-001",
    videoId: "dQw4w9WgXcQ",
    title: "Glass Horizon",
    artist: "Nova Aster",
    album: "Afterglow Frequencies",
    duration: 214,
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=60",
    color: "purple",
    lyrics: [
      { time: 0, line: "City lights blur into static" },
      { time: 12, line: "Counting exits on a Tuesday night" },
      { time: 24, line: "You said the silence was the loudest part" },
      { time: 38, line: "Glass horizon, catch me if I fall" },
      { time: 52, line: "We were signal, we were sound" },
      { time: 66, line: "Every frequency remembers you" },
    ],
    diary:
      "Wrote this after a red-eye flight into a city I didn't recognize anymore. The chorus came first — everything else built around that one falling feeling.",
    credits: [
      { role: "Vocals", name: "Nova Aster" },
      { role: "Production", name: "Kilo Sato" },
      { role: "Mix Engineer", name: "Priya Nandan" },
      { role: "Strings", name: "Ensemble Verre" },
    ],
  },
  {
    id: "ml-002",
    videoId: "3JZ_D3ELwOQ",
    title: "Low Static",
    artist: "Kilo Sato",
    album: "Room Tone",
    duration: 198,
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=60",
    color: "green",
    lyrics: [
      { time: 0, line: "Turn the dial past the noise" },
      { time: 14, line: "Find the station only we know" },
      { time: 29, line: "Low static, steady heartbeat" },
      { time: 44, line: "Nothing's lost if you keep it playing" },
      { time: 58, line: "Hold the frequency, hold my hand" },
    ],
    diary:
      "Built entirely from field recordings of an old radio in my grandmother's kitchen. The hum you hear under the bass is real tape hiss, not a plugin.",
    credits: [
      { role: "Vocals & Production", name: "Kilo Sato" },
      { role: "Bass", name: "Reo Fujimori" },
      { role: "Mastering", name: "Delphine Auroux" },
    ],
  },
  {
    id: "ml-003",
    videoId: "5qap5aO4i9A",
    title: "Terracotta Skies",
    artist: "Delphine Auroux",
    album: "Southbound",
    duration: 231,
    thumbnail: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400&q=60",
    color: "amber",
    lyrics: [
      { time: 0, line: "Dust on the dashboard, sun going down" },
      { time: 16, line: "Terracotta skies over a two-lane road" },
      { time: 33, line: "You're humming something I can't place" },
      { time: 49, line: "This is the part I want to keep" },
      { time: 65, line: "Terracotta skies, don't fade on me yet" },
    ],
    diary:
      "Recorded live in one take with the windows down — you can hear a truck pass at 1:38 and we kept it. Felt more honest than cutting it out.",
    credits: [
      { role: "Vocals, Guitar", name: "Delphine Auroux" },
      { role: "Drums", name: "Marcus Yeboah" },
      { role: "Production", name: "Priya Nandan" },
    ],
  },
  {
    id: "ml-004",
    videoId: "eY52Zsg-KVI",
    title: "Vibe Queue Anthem",
    artist: "Reo Fujimori",
    album: "Merge Protocol",
    duration: 187,
    thumbnail: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&q=60",
    color: "pink",
    lyrics: [
      { time: 0, line: "Everybody's taste in the same room now" },
      { time: 13, line: "Algorithm found the middle ground" },
      { time: 27, line: "Your favorite next to mine, no arguments" },
      { time: 41, line: "This is what a shared room sounds like" },
    ],
    diary:
      "Made this specifically to test how songs feel when they're built for a crowd instead of one listener — every section peaks at a different volume on purpose.",
    credits: [
      { role: "Vocals, Synths", name: "Reo Fujimori" },
      { role: "Additional Production", name: "Nova Aster" },
    ],
  },
  {
    id: "ml-005",
    videoId: "M7lc1UVf-VE",
    title: "Patio Lights",
    artist: "Ensemble Verre",
    album: "Afterglow Frequencies",
    duration: 205,
    thumbnail: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&q=60",
    color: "purple",
    lyrics: [
      { time: 0, line: "String lights swinging in the warm wind" },
      { time: 15, line: "Everyone's voice turns into music" },
      { time: 30, line: "Kitchen door open, bassline drifting out" },
      { time: 47, line: "This house has never sounded better" },
    ],
    diary:
      "The string arrangement was recorded outdoors on purpose — you can hear crickets in the background if you listen closely on good headphones.",
    credits: [
      { role: "Strings", name: "Ensemble Verre" },
      { role: "Field Recording", name: "Kilo Sato" },
      { role: "Mix Engineer", name: "Priya Nandan" },
    ],
  },
  {
    id: "ml-006",
    videoId: "OPf0YbXqDm0",
    title: "Bedroom Broadcast",
    artist: "Marcus Yeboah",
    album: "Room Tone",
    duration: 176,
    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=60",
    color: "green",
    lyrics: [
      { time: 0, line: "Whisper it low so the walls don't wake" },
      { time: 12, line: "This is the mix only midnight hears" },
      { time: 26, line: "Bedroom broadcast, volume down to three" },
      { time: 40, line: "Still loud enough to keep me here" },
    ],
    diary:
      "Wrote and produced this entirely on headphones between midnight and 3am over about two weeks. It's meant to be listened to quiet, not loud.",
    credits: [
      { role: "Everything", name: "Marcus Yeboah" },
      { role: "Mastering", name: "Delphine Auroux" },
    ],
  },
];

export const MOCK_REACTIONS = [
  { id: "r1", trackId: "ml-001", time: 24, emoji: "🔥", user: "priya", text: "this line hits every time" },
  { id: "r2", trackId: "ml-001", time: 52, emoji: "😭", user: "reo", text: "" },
  { id: "r3", trackId: "ml-002", time: 14, emoji: "📻", user: "delphine", text: "the static!!" },
  { id: "r4", trackId: "ml-003", time: 65, emoji: "🌅", user: "marcus", text: "" },
];

export const FRIEND_ROOMS = [
  {
    id: "room-1",
    name: "Priya's Sunset Drive",
    host: "priya",
    listeners: 4,
    trackId: "ml-003",
    live: true,
  },
  {
    id: "room-2",
    name: "Late Night Lo-Fi w/ Reo",
    host: "reo",
    listeners: 2,
    trackId: "ml-006",
    live: true,
  },
  {
    id: "room-3",
    name: "Kilo's Studio Session",
    host: "kilo",
    listeners: 7,
    trackId: "ml-002",
    live: false,
  },
];
