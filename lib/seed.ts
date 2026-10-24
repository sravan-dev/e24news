import type { Article } from "./types";
import { slugify } from "./format";

// Dummy content used to populate a fresh install. Admin can edit or delete all of it.
const SEED: Record<string, string[]> = {
  kerala: [
    "Super League Kerala: Thiruvananthapuram Kombans take on Thrissur Magic FC tonight",
    "Thiruvalla YMCA Vikas School unveils new development projects",
    "Families of Malayalis killed in Germany fire seek help to bring bodies home",
    "Monthly payment case: Chief Minister's office responds to ED summons",
    "State to study rollout of new labour codes before implementation",
    "New Governor to be sworn in at Raj Bhavan today",
    "Kochi Metro phase two works to begin next month",
    "Heavy rain alert issued for five districts",
  ],
  qatar: [
    "WMF Qatar National Council's Spotlight '26 dance festival draws record crowd",
    "French President Emmanuel Macron arrives in Doha for two-day visit",
    "Qatar Airways adds more flights to Riyadh and Dammam",
    "Qatar Incas Palakkad district committee holds family meet",
    "Jumbo Electronics announces mega promotion across Qatar",
  ],
  gulf: [
    "Riyadh services suspended until October 15, airline confirms",
    "King Khalid International Airport opens new terminal wing",
    "Flights to Kochi rescheduled after airspace disruption",
    "UAE announces long weekend for National Day",
    "Oman eases visa rules for GCC residents",
  ],
  india: [
    "'Jailer 2' box office run continues into second week",
    "Opposition leader's foreign trip sparks political row",
    "ISRO prepares for next lunar mission launch window",
    "RBI keeps repo rate unchanged for fourth time",
  ],
  "grama-vartha": [
    "Angamaly native donates a bus to KSRTC as a gift to his hometown",
    "Escaped prisoner recaptured within an hour after police spot him",
    "Snehasparsham 2026: helping hand for patients in need",
    "New district with Muvattupuzha as headquarters under consideration",
    "Basheer Muttathil passes away at 64",
  ],
  "writers-corner": [
    "The quiet libraries of Malabar and the readers who keep them alive",
    "Letters home: a Gulf migrant's notebook from 1987",
    "Why Malayalam poetry is finding a new audience online",
  ],
  tech: [
    "Green card rules: TCS says changes are not part of its hiring strategy",
    "Indian robotics, agritech and medtech startups draw global investors",
    "Big job opportunities open up in the space sector",
    "Europe calls for tighter controls on AI development",
    "Kerala Startup Mission launches new incubation programme",
  ],
  movies: [
    "Bollywood actor's car shot at outside Mumbai home",
    "Veteran actor Nana Patekar dies at 75",
    "Court intervenes on actress's complaint against producer",
    "18th IDSFFK opens in Thiruvananthapuram today",
    "Mohanlal's next big release gets a festival date",
  ],
  world: [
    "US immigration curbs not targeted at India, says Marco Rubio",
    "Navanethem Pillay honoured for lifetime of peace work",
    "Setback for Indian IT sector as new visa fees take effect",
    "Messi's final match: Argentina says goodbye to a legend",
  ],
  sports: [
    "Kerala Blasters sign new striker ahead of ISL season",
    "India clinch T20 series with a game to spare",
    "Sanju Samson named in squad for Australia tour",
    "State school athletics meet begins in Kunnamkulam",
  ],
  magazines: [
    "Cover story: the new face of Kerala tourism",
    "In conversation with a 90-year-old Kathakali maestro",
    "Weekend reads: ten books to pick up this month",
  ],
};

const AUTHORS = ["E24 Desk", "Staff Reporter", "Anjali Menon", "Rahul Nair", "Fathima Basheer"];

function makeContent(title: string, category: string): { excerpt: string; content: string } {
  const excerpt = `${title}. Our correspondent reports on the latest developments, reactions from the people involved and what it means for readers across Kerala and the Gulf.`;
  const paras = [
    excerpt,
    "Officials said the details would be shared in the coming days. Local residents and community leaders welcomed the move, while others raised questions about the timeline and the cost involved. A detailed statement is expected later this week.",
    `This is placeholder text for the ${category.replace("-", " ")} section. Replace it from the admin panel with the real story, quotes and context. Paragraphs are separated by a blank line, and each one is shown as its own block on the article page.`,
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla.",
    "E24 News will continue to follow the story and update this report as more information becomes available.",
  ];
  return { excerpt, content: paras.join("\n\n") };
}

export function buildSeed(): Article[] {
  const out: Article[] = [];
  const base = new Date("2026-10-23T10:00:00+05:30").getTime();
  const cats = Object.keys(SEED);
  const maxLen = Math.max(...cats.map((c) => SEED[c].length));
  let n = 0;
  // Interleave categories so the newest posts are a mix of sections.
  for (let i = 0; i < maxLen; i++) {
    for (const cat of cats) {
      const title = SEED[cat][i];
      if (!title) continue;
      const published = new Date(base - n * 1000 * 60 * 60 * 9).toISOString();
      const slug = slugify(title);
      const { excerpt, content } = makeContent(title, cat);
      out.push({
        id: `seed-${n + 1}`,
        slug,
        title,
        excerpt,
        content,
        image: `https://picsum.photos/seed/${encodeURIComponent(slug.slice(0, 30))}/1200/800`,
        category: cat,
        author: AUTHORS[n % AUTHORS.length],
        tags: [cat],
        featured: n < 5,
        trending: n < 6,
        status: "published",
        views: Math.floor(((n * 7919) % 900) + 50),
        publishedAt: published,
        updatedAt: published,
      });
      n++;
    }
  }
  return out;
}
