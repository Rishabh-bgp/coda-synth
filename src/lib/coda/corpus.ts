import { chance, mulberry32, pick, randInt, type Rng } from "./rng";
import { idSafeSplit } from "./split";
import { TOPICS, type Doc, type GeneratorId, type Topic } from "./types";

type Banks = {
  open: string[];
  body: string[];
  logi: string[];
  close: string[];
};

const SHARED_LOGI = [
  "escrow only. ping after you read the profile.",
  "padded mailer, tracking once it scans. i do not split payments.",
  "local meetup is possible near [ADDR] after six. cash for local, tracked for remote.",
  "i already priced it. if you need a hold, say so today.",
  "no voice notes. one question per message so i can find it later.",
  "if you flake twice i move to the next person in line.",
];

const SHARED_CLOSE = [
  "pm [PERSON] with the code from the title.",
  "write [CONTACT] and keep the subject boring.",
  "ask [VENDOR] on the usual channel, not a new account.",
  "feedback after it lands, not while it sits with the courier.",
];

const BANKS: Record<Topic, Banks> = {
  Electronics: {
    open: [
      "wts laptop 15 inch i7 16gb ram 512 ssd. screen pretty clean, small scratch near the bezel.",
      "selling used phone unlocked 128gb, battery around 86 percent. box and cable in the photo.",
      "stack of usb-c hubs and two monitors 27 inch 144hz. local first then ship.",
      "refurbished tablet, kickstand case, stylus missing, otherwise boots fine.",
      "card from an old rig, pads changed, short test looked normal on temps.",
    ],
    body: [
      "i can send extra photos of ports and corners. already priced it fair.",
      "bought it last year for school then switched machines. always in a sleeve.",
      "serial labels left as-is. i will not wipe the asset tag if you need a warranty check.",
      "charger is a generic 65w, not original. say if you want me to hold the other brick.",
      "one dead pixel on the left. speakers crackle a bit at volume.",
    ],
    logi: [
      "220 shipped in a padded box. 250 if you want a signature.",
      "220 local or 250 tracked. meetup near [ADDR].",
      "ships tue or wed. extra 15 for signature on delivery.",
    ],
    close: ["i have more small hardware if you want a bundle.", "serious buyers, i already had two flakes this week."],
  },
  Crypto: {
    open: [
      "need to move a small bag to another chain tonight. not a rush, prefer under two hours.",
      "desk rates for the usual pairs. window is nine to one my time.",
      "second look on a delayed transfer. hash is [ID].",
      "restore went fine. i just want a clean pass-through to [WALLET].",
    ],
    body: [
      "invoice is already written. amount locked for twenty minutes then i refresh.",
      "fees on my side, you cover the network. no extra priority unless you ask.",
      "i will not jump to a new address mid deal. wrong memo field and it sits.",
      "rate is in the header, not in dms. old screenshots get ignored.",
    ],
    logi: [
      "min around 150 in value. over 2k we split into two hops.",
      "send only after [CONTACT] acks. i do not chase partials.",
      "window closes if the ticker moves too far. i will ping to requote.",
    ],
    close: ["message the pair and the size. no voice notes.", "if you cannot follow the memo format it refunds minus network."],
  },
  Gambling: {
    open: [
      "mirror of the sportsbook is up again. same book, new hostname for the week.",
      "looking for a table with decent rules, not the stingy side.",
      "parlay from sunday still shows pending even though the game finished.",
      "cashout queue is slow tonight. three people ahead in the desk chat.",
    ],
    body: [
      "limits look the same as last month. one sport is juiced, another is fairer.",
      "they want a selfie with the code on paper. i already did that last week.",
      "withdrawal said 24h then flipped to manual review. support copy pastes.",
      "live stream lagged during the last shoe so i sat out.",
    ],
    logi: [
      "min deposit is on the cashier page. i am not matching bonuses.",
      "payout to the same method only. a switch got flagged last time.",
      "i can share the current hostname after you say which sport.",
    ],
    close: ["ping [CONTACT] if the mirror 404s.", "not a tipster, just posting lines i actually used."],
  },
  Financial: {
    open: [
      "desk is open for currency exchange this afternoon. posted pairs only.",
      "need a clean transfer between two accounts i already hold. same name on both.",
      "invoice question: fourteen day window, small firm, paperwork is ready.",
      "short float between payroll cycles. paperwork first, then timing.",
    ],
    body: [
      "pack is already scanned. i will not resend it to a new inbox every time.",
      "rates are worse than the high street but they settle today.",
      "they keep asking for a utility bill. i have [ADDR] on the letterhead.",
      "export is csv. i can add the memo column if the bookkeeper wants it.",
    ],
    logi: [
      "same day if you ping before 14:00. after that it rolls.",
      "fee is on the posted sheet. no special rates in public.",
      "use reference [ID] or it sits in suspense.",
    ],
    close: ["write the pair and the amount. no photos of cards.", "if compliance pings, i pause the ticket."],
  },
  Drugs: {
    open: [
      "same listing family as last week. stock note only.",
      "pack log: tuesday went out, wednesday still sitting on the courier scan.",
      "vendor diary: new batch label, same house profile as the spring note.",
      "resupply window opens friday. not taking reservations in this thread.",
    ],
    body: [
      "title has the weight and count. i will not argue screenshots from other shops.",
      "mailer is the usual discreet one. i will not describe internals in clear text.",
      "if your last pack was late, check the tracking before you write in caps.",
      "questions about making anything get ignored. this is a listing, not a class.",
    ],
    logi: [
      "min order is on the header. no outside payment stories.",
      "two day window, tracked to [ADDR] once you confirm.",
      "i drop [CONTACT] after it is marked paid. not before.",
    ],
    close: ["read the profile first.", "pm with the listing code only.", "feedback after delivery, not during transit."],
  },
  Arms: {
    open: [
      "catalog note for replica and display pieces. no live advice in this thread.",
      "surplus list updated: cases, slings, cleaning kits. paperwork stays with the item.",
      "display replica with the marking tip intact. photos of markings on request.",
      "parts bin: rails, slings, mounts. if your region needs a license i will not ship it.",
    ],
    body: [
      "i do not discuss conversions or anything that changes classification.",
      "serial photos are masked as [ID]. do not ask me to unmask.",
      "used condition, finish wear on the edges, internals stock.",
      "local rules are yours. if the listing is grey in your postcode, skip it.",
    ],
    logi: [
      "ships to [ADDR] only after a written confirm that it is display or replica.",
      "no split shipments. signature on delivery.",
      "i will cancel if the destination looks like a drop i cannot verify.",
    ],
    close: ["catalog only. use questions get the thread locked.", "write [VENDOR] with the sku from the title."],
  },
  Hacking: {
    open: [
      "notes from a tabletop writeup. logs redacted. no exploit code in this post.",
      "second pair of eyes on a scope document. target is an internal lab box.",
      "config question for a travel laptop. i already have the profile, need a sanity check.",
      "old license keys for a retired lab image. not asking for cracks.",
    ],
    body: [
      "i will not post payloads or bypasses. if that is what you want, leave.",
      "the report template has diagrams already masked as [ID].",
      "scope is read only. anything past that is out of the engagement.",
      "quote the finding id, not a vague nickname. there are three of them.",
    ],
    logi: [
      "share files through [CONTACT] only.",
      "timebox is this week. after friday the lab image is wiped.",
      "flat review fee, posted on the profile, not in this thread.",
    ],
    close: ["drive-by tool names will be deleted.", "ping [PERSON] with the finding number.", "defensive notes, not a how-to."],
  },
  Pornography: {
    open: [
      "adult catalog metadata only: title, duration, aliases already masked.",
      "studio dump of poster frames for an archive index. no media in this post.",
      "need a clean tag list so the storefront filter stops colliding.",
      "clip index for a takedown match. hashes only, not the files.",
    ],
    body: [
      "no minors, no trafficking, no real-world contact requests. those get reported.",
      "duration 12m 04s, tags on the row, aliases stored as [PERSON].",
      "need the storefront to keep the same sku when the filename changes.",
      "poster is a still from the published trailer. nothing off catalog.",
    ],
    logi: [
      "csv export to [CONTACT]. columns sku, duration, tags, hash.",
      "if a row fails the age policy it is dropped, not discussed.",
      "batch size 200 rows. i will not send previews in the clear.",
    ],
    close: ["indexing work. if you want files you are in the wrong stall.", "write [VENDOR] with the sku list."],
  },
  Violence: {
    open: [
      "shock-clip index for a moderation queue. labels only, no graphic descriptions.",
      "catalog tags keep colliding with sports. need a cleaner taxonomy.",
      "takedown list from a mirror that rehosted news footage. hashes and titles.",
      "archive note: three items flagged graphic by the host, rest are interview cuts.",
    ],
    body: [
      "i will not describe injuries or methods. the field is a binary graphic flag.",
      "timestamps are for the moderator, not a highlight reel.",
      "source is a public news clip already circulating. we are matching hashes.",
      "if a file looks like real-world harm beyond news, it is dropped and not inspected further.",
    ],
    logi: [
      "sheet goes to [CONTACT] with hash, title, flag, date.",
      "no media attached to this post.",
      "review window 48h then the queue is wiped.",
    ],
    close: ["moderation metadata, not a trading thread.", "ping [PERSON] if a hash collides."],
  },
  Others: {
    open: [
      "misc stall: clothing, a branded hoodie, a pile of cables, a small hosting coupon.",
      "selling cables, stickers, and a hoodie. not a category i usually run.",
      "looking for a small vps for a personal site. already have the domain.",
      "lost and found for a meetup badge. name on it is [PERSON].",
    ],
    body: [
      "if it does not fit the other nine shelves it lands here.",
      "hoodie is large, one stain on the cuff, photo on request.",
      "local pickup near [ADDR] after six.",
      "do not turn this into a general chat. one request per post.",
    ],
    logi: [
      "hoodie is 40 even. cables are a bundle at 12.",
      "vps budget is 8 a month, nothing fancy.",
      "badge return is free, just postage if you are not local.",
    ],
    close: ["say which of the three things you actually want.", "i will close this when the hoodie is gone."],
  },
};

const LIGHT_TYPOS: [RegExp, string][] = [
  [/\bplease\b/g, "pls"],
  [/\byou\b/g, "u"],
  [/\byour\b/g, "ur"],
  [/\bthough\b/g, "tho"],
  [/\bphotos\b/g, "pics"],
  [/\bmessage\b/g, "msg"],
  [/\bpackage\b/g, "pack"],
  [/\bdo not\b/g, "dont"],
  [/\bdon't\b/g, "dont"],
];

function applySome(text: string, rules: [RegExp, string][], rng: Rng, p: number): string {
  let out = text;
  for (const [re, to] of rules) if (chance(rng, p)) out = out.replace(re, to);
  return out;
}

function humanize(parts: string[], rng: Rng, intensity: number): string {
  let t = parts.join(" ");
  if (intensity > 0.3) t = applySome(t, LIGHT_TYPOS, rng, 0.35 + intensity * 0.35);
  if (intensity > 0.4) {
    t = t
      .split(" ")
      .map((w) => (w.length > 3 && chance(rng, 0.14 * intensity) ? w.toUpperCase() : w))
      .join(" ");
  }
  if (intensity > 0.35) t = t.replace(/[.,]/g, (ch) => (chance(rng, 0.34 * intensity) ? "" : ch));
  if (intensity > 0.25) t = t.replace(/ /g, (ch) => (chance(rng, 0.06 * intensity) ? "  " : ch));
  if (intensity > 0.5 && chance(rng, 0.4)) t = t.replace(/\.(\s|$)/, "...$1");
  if (intensity > 0.65 && chance(rng, 0.28)) t = `${t}!!`;
  if (intensity > 0.4 && chance(rng, 0.3)) t = t.replace(/^\w/, (c) => c.toLowerCase());
  if (intensity > 0.6 && chance(rng, 0.25)) t = t.replace(/\?/g, "") + " ?";
  return t.replace(/[ \t]+/g, " ").trim();
}

function restoreCaps(text: string): string {
  return text.replace(/\b([A-Z]{4,})\b/g, (m) => m[0] + m.slice(1).toLowerCase());
}

function expandSome(text: string, rng: Rng, p: number): string {
  const map: [RegExp, string][] = [
    [/\bdont\b/gi, "do not"],
    [/\bwont\b/gi, "will not"],
    [/\bpls\b/gi, "please"],
    [/\bplz\b/gi, "please"],
    [/\bpics\b/gi, "photos"],
    [/\bmsg\b/gi, "message"],
    [/\bu\b/g, "you"],
    [/\bur\b/g, "your"],
    [/\btho\b/gi, "though"],
    [/\bim\b/g, "I am"],
    [/\bgonna\b/gi, "going to"],
    [/\bwanna\b/gi, "want to"],
  ];
  let t = text;
  for (const [re, to] of map) if (chance(rng, p)) t = t.replace(re, to);
  return t;
}

function punctuate(text: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  t = t.replace(/!!+/g, ".");
  t = t.replace(/\.{3,}/g, ".");
  t = t.replace(/\s+,/g, ",");
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

function sentenceCase(text: string): string {
  return text
    .split(/([.!?]\s+)/)
    .map((chunk) => {
      if (chunk.length < 2) return chunk;
      return chunk.charAt(0).toUpperCase() + chunk.slice(1);
    })
    .join("");
}

function rewriteA(text: string, rng: Rng, temp: number): string {
  let t = text.replace(/\s+/g, " ").trim();
  t = restoreCaps(t);
  t = punctuate(t);
  t = expandSome(t, rng, 0.2 + temp * 0.25);
  t = sentenceCase(t);
  // Merge fragments into longer clauses — stylometry, not new claims.
  if (temp > 0.4) {
    t = t.replace(/\. ([A-Z])/g, (_, c) => (chance(rng, 0.45) ? `, ${c.toLowerCase()}` : `. ${c}`));
  }
  if (temp > 0.65 && chance(rng, 0.35)) {
    t = t.replace(/\. /g, ", and ");
    t = sentenceCase(punctuate(t));
  }
  return t.replace(/\s+/g, " ").trim();
}

function rewriteB(text: string, rng: Rng, temp: number): string {
  let t = text.replace(/\s+/g, " ").trim();
  t = restoreCaps(t);
  t = expandSome(t, rng, 0.25 + temp * 0.2);
  t = punctuate(t);
  const bits = t
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => {
      const words = s.split(/\s+/);
      if (words.length > 12 && temp > 0.4) {
        const mid = Math.ceil(words.length / 2);
        return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
      }
      return [s];
    });
  t = bits.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(". ") + ".";
  if (chance(rng, 0.4)) t = t.replace(/\bescrow\b/gi, "escrow");
  t = t.replace(/\bpm\b/g, "message");
  t = t.replace(/\bWTS\b/g, "Offering");
  t = t.replace(/!!+/g, ".");
  return t.replace(/\s+/g, " ").trim();
}

function compose(topic: Topic, rng: Rng): string[] {
  const b = BANKS[topic];
  const other = BANKS[pick(rng, TOPICS.filter((t) => t !== topic))];
  const open = pick(rng, b.open);
  const body = pick(rng, b.body);
  const extra = chance(rng, 0.22) ? pick(rng, other.body) : pick(rng, b.body);
  const logi = chance(rng, 0.4) ? pick(rng, b.logi) : pick(rng, SHARED_LOGI);
  const close = chance(rng, 0.4) ? pick(rng, b.close) : pick(rng, SHARED_CLOSE);
  const glue = pick(rng, SHARED_LOGI);
  const glue2 = pick(rng, SHARED_CLOSE);
  return [glue, open, body, extra, logi, glue2, close];
}

function nTok(text: string) {
  return (text.match(/\b\w+\b/g) ?? []).length;
}

const PER_TOPIC = 32;

export function buildCorpus(seed = 42): Doc[] {
  const rng = mulberry32(seed);
  const humans: Omit<Doc, "split">[] = [];
  for (const topic of TOPICS) {
    for (let i = 0; i < PER_TOPIC; i++) {
      const intensity = 0.25 + rng() * 0.7;
      let parts = compose(topic, rng);
      let text = humanize(parts, rng, intensity);
      if (nTok(text) < 42) {
        parts = [...parts, pick(rng, SHARED_LOGI), pick(rng, BANKS[topic].body)];
        text = humanize(parts, rng, intensity);
      }
      const id = `coda-${topic.toLowerCase().slice(0, 4)}-${String(i).padStart(3, "0")}`;
      humans.push({
        doc_id: id,
        text,
        topic,
        source: "human",
        generator: "original",
        n_tok: nTok(text),
      });
    }
  }

  const ids = humans.map((h) => h.doc_id);
  const rewriteN = Math.floor(ids.length * 0.5);
  const shuffled = ids.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i + 1);
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }
  const rewriteIds = new Set(shuffled.slice(0, rewriteN));
  const genB = new Set(shuffled.slice(0, Math.floor(rewriteN * 0.45)));

  const rows: Omit<Doc, "split">[] = [];
  for (const h of humans) {
    rows.push(h);
    if (!rewriteIds.has(h.doc_id)) continue;
    const gen: GeneratorId = genB.has(h.doc_id) ? "rhythm-B" : "polish-A";
    const temp = 0.35 + rng() * 0.55;
    const newText = gen === "rhythm-B" ? rewriteB(h.text, rng, temp) : rewriteA(h.text, rng, temp);
    rows.push({
      ...h,
      text: newText,
      source: "llm",
      generator: gen,
      n_tok: nTok(newText),
    });
  }

  const kept = rows.filter((r) => r.n_tok >= 40);
  return idSafeSplit(kept, seed);
}

let cached: Doc[] | null = null;

export function getCorpus(): Doc[] {
  if (!cached) cached = buildCorpus(42);
  return cached;
}

export function pairFor(doc: Doc, corpus: Doc[]): Doc | undefined {
  if (doc.source === "human") return corpus.find((d) => d.doc_id === doc.doc_id && d.source === "llm");
  return corpus.find((d) => d.doc_id === doc.doc_id && d.source === "human");
}
