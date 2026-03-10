export const VOICES = [
  { id: 1, name: "Nova",  gender: "Female", accent: "American",   tone: "Warm",  uses: 1240, color: "#A78BFA" },
  { id: 2, name: "Atlas", gender: "Male",   accent: "British",    tone: "Deep",  uses: 893,  color: "#22D3EE" },
  { id: 3, name: "Sage",  gender: "Female", accent: "Australian", tone: "Clear", uses: 654,  color: "#F472B6" },
  { id: 4, name: "Orion", gender: "Male",   accent: "Neutral",    tone: "Rich",  uses: 420,  color: "#34D399" },
];

export const HISTORY = [
  { id: 1, title: "Product Announcement",  voice: "Nova",  chars: 420,  duration: "1:24", date: "Today, 2:14 PM",  },
  { id: 2, title: "Podcast Intro Script",  voice: "Atlas", chars: 850,  duration: "2:51", date: "Today, 11:30 AM" },
  { id: 3, title: "E-learning Module 3",   voice: "Sage",  chars: 1200, duration: "4:10", date: "Yesterday"       },
  { id: 4, title: "Customer Onboarding",   voice: "Orion", chars: 340,  duration: "1:08", date: "Dec 12"          },
  { id: 5, title: "Social Media Ad Copy",  voice: "Nova",  chars: 180,  duration: "0:36", date: "Dec 11"          },
  { id: 6, title: "Audiobook Chapter 1",   voice: "Atlas", chars: 2100, duration: "7:02", date: "Dec 10"          },
];

export const STATS = [
  { label: "Total Generated", value: "3,847", sub: "audio files" },
  { label: "This Month",      value: "124",   sub: "+12% vs last month", accent: true },
  { label: "Hours of Audio",  value: "48.2h", sub: "across all voices",  accent2: true },
  { label: "Favorite Voice",  value: "Nova",  sub: "1,240 generations"  },
];
