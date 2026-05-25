export interface SongPreset {
  id: string;
  name: string;
  artist: string;
  lyrics: string;
  audioUrl: string;
  textColor: string;
  font: string;
  fromColor: string;
  toColor: string;
  fontUrl?: string; // URL to download the font if needed on-demand
}

export const LYRICS_PRESETS: SongPreset[] = [
  {
    id: "chashma-lagwla",
    name: "Chashma Lagwla Se Hero",
    artist: "Bhojpuri Viral",
    lyrics: "CHASMAA\nLAGWLA\nSE\nHERO\nNA\nKAHAIBAA\nYEE\nBABUUAA\nBAKLOL\nVE\nKAHAIBAA\nYE\nBABUUAA",
    audioUrl: "/audio/chashma-lagwla.mp3",
    textColor: "#ef4444", // Red-500
    font: "Caveat",
    fontUrl: "https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bTCYB2I7M8Kp-A.ttf",
    fromColor: "#cfcca4", // Creamy Olive Top
    toColor: "#a39f78"   // Creamy Olive Bottom
  },
  {
    id: "tum-hi-ho",
    name: "Tum Hi Ho",
    artist: "Arijit Singh",
    lyrics: "HUM TERE BIN\nAB REH NAHI SAKTE\nTERE BINA\nKYA WOOJOOD MERA\nTUZSE JUDA\nAGAR HO JAYENGE\nTO KHUD SE HI\nHO JAYENGE JUDA",
    audioUrl: "/audio/tum-hi-ho.mp3",
    textColor: "#ffffff", // White
    font: "Montserrat",
    fontUrl: "https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4MV96vpF4.ttf",
    fromColor: "#2b5876", // Deep Slate Blue
    toColor: "#4e4376"   // Indigo Grey
  },
  {
    id: "love-story",
    name: "Love Story",
    artist: "Taylor Swift",
    lyrics: "WE WERE BOTH YOUNG\nWHEN I FIRST SAW YOU\nI CLOSE MY EYES\nAND THE FLASHBACK STARTS\nI'M STANDING THERE\nON A BALCONY\nIN SUMMER AIR",
    audioUrl: "/audio/love-story.mp3",
    textColor: "#fdf2f8", // Light Pink/White
    font: "Caveat",
    fontUrl: "https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bTCYB2I7M8Kp-A.ttf",
    fromColor: "#ff7e5f", // Warm Sunset Rose
    toColor: "#feb47b"   // Warm Peach
  },
  {
    id: "calm-down",
    name: "Calm Down",
    artist: "Rema",
    lyrics: "BABY, CALM DOWN\nCALM DOWN\nGIRL, THIS YOUR BODY\nDEY PUT MY HEART\nFOR LOCKDOWN\nFOR LOCKDOWN\nOH, LOCKDOWN",
    audioUrl: "/audio/calm-down.mp3",
    textColor: "#eab308", // Yellow-500
    font: "Bangers",
    fontUrl: "https://fonts.gstatic.com/s/bangers/v20/FeV-0ZqAGrj5bEkN7iaG.ttf",
    fromColor: "#134e5e", // Teal Dark
    toColor: "#71b280"   // Sage Green
  }
];

export const GRADIENTS_PRESETS = [
  { name: "Cream Olive (Reference)", fromColor: "#cfcca4", toColor: "#a39f78" },
  { name: "Sunset Orange", fromColor: "#ff7e5f", toColor: "#feb47b" },
  { name: "Ocean Twilight", fromColor: "#2b5876", toColor: "#4e4376" },
  { name: "Emerald Mist", fromColor: "#134e5e", toColor: "#71b280" },
  { name: "Deep Purple", fromColor: "#3a1c71", toColor: "#d76d77" }
];
