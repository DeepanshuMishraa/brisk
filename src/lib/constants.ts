export interface Site {
  category: string;
  name: string;
  url: string;
}

export const sites: Site[] = [
  {
    category: "Social Networking",
    name: "reddit",
    url: "https://reddit.com",
  },
  {
    category: "Social Networking",
    name: "twitter",
    url: "https://twitter.com",
  },
  {
    category: "Social Networking",
    name: "x.com",
    url: "https://x.com",
  },
  {
    category: "Social Networking",
    name: "facebook",
    url: "https://facebook.com",
  },
  {
    category: "Social Networking",
    name: "instagram",
    url: "https://instagram.com",
  },
  {
    category: "Social Networking",
    name: "linkedin",
    url: "https://linkedin.com",
  },
  {
    category: "Social Networking",
    name: "pinterest",
    url: "https://pinterest.com",
  },
  {
    category: "Social Networking",
    name: "tiktok",
    url: "https://tiktok.com",
  },
  {
    category: "Social Networking",
    name: "snapchat",
    url: "https://snapchat.com",
  },
  {
    category: "Social Networking",
    name: "discord",
    url: "https://discord.com",
  },
  {
    category: "Social Networking",
    name: "telegram",
    url: "https://telegram.org",
  },
  {
    category: "Entertainment",
    name: "youtube",
    url: "https://youtube.com",
  },
  {
    category: "Entertainment",
    name: "netflix",
    url: "https://netflix.com",
  },
  {
    category: "Entertainment",
    name: "amazon prime",
    url: "https://primevideo.com",
  },
  {
    category: "Entertainment",
    name: "hulu",
    url: "https://hulu.com",
  },
  {
    category: "Entertainment",
    name: "disney plus",
    url: "https://disneyplus.com",
  },
  {
    category: "Entertainment",
    name: "apple tv plus",
    url: "https://appletvplus.com",
  },
  {
    category: "Entertainment",
    name: "apple music",
    url: "https://music.apple.com",
  },
  {
    category: "Entertainment",
    name: "spotify",
    url: "https://spotify.com",
  },
  {
    category: "Entertainment",
    name: "twitch",
    url: "https://twitch.tv",
  },
  {
    category: "Entertainment",
    name: "crunchyroll",
    url: "https://crunchyroll.com",
  },
  {
    category: "Gaming",
    name: "steam",
    url: "https://store.steampowered.com",
  },
  {
    category: "Gaming",
    name: "epic games",
    url: "https://epicgames.com",
  },
  {
    category: "Gaming",
    name: "roblox",
    url: "https://roblox.com",
  },
  {
    category: "Gaming",
    name: "minecraft",
    url: "https://minecraft.net",
  },
  {
    category: "Shopping",
    name: "amazon",
    url: "https://amazon.com",
  },
  {
    category: "Shopping",
    name: "ebay",
    url: "https://ebay.com",
  },
  {
    category: "Shopping",
    name: "etsy",
    url: "https://etsy.com",
  },
  {
    category: "News",
    name: "cnn",
    url: "https://cnn.com",
  },
  {
    category: "News",
    name: "bbc",
    url: "https://bbc.com",
  },
  {
    category: "News",
    name: "reddit news",
    url: "https://reddit.com/r/news",
  },
];

export function searchSites(query: string): Site[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return sites.filter(
    (site) =>
      site.name.toLowerCase().includes(lowerQuery) ||
      site.url.toLowerCase().includes(lowerQuery) ||
      site.category.toLowerCase().includes(lowerQuery)
  );
}
