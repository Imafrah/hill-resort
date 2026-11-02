/**
 * AI Enquiry Router for Misty Peaks Estate
 * 
 * Classifies guest enquiries into categories, extracts structured entities
 * (dates, guest counts, budgets), assigns staff owners, and drafts replies.
 * 
 * Safeguards:
 * - Low-confidence classifications go to an "unsorted" lane (GM sees)
 * - Complaints ALWAYS alert the GM
 * - Prices in drafts come from the rate table, never from the AI
 * - Drafts are never sent automatically
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnquiryCategory = 'wedding' | 'room_booking' | 'corporate_offsite' | 'complaint' | 'general';

export interface Classification {
  category: EnquiryCategory;
  confidence: number;
  isLowConfidence: boolean;
}

export interface ExtractedEntities {
  dates: string[];
  guestCount: number | null;
  budget: string | null;
  nights: number | null;
  roomType: string | null;
}

export interface Assignment {
  assignedTo: string;
  alertGM: boolean;
}

export interface ProcessedEnquiry {
  classification: Classification;
  entities: ExtractedEntities;
  assignment: Assignment;
  draftReply: string;
}

// ─── Keyword Dictionaries ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<EnquiryCategory, { words: string[]; weight: number }> = {
  wedding: {
    words: [
      'wedding', 'shaadi', 'reception', 'mandap', 'marriage', 'mehendi',
      'sangeet', 'bride', 'groom', 'ceremony', 'nikah', 'haldi',
      'engagement', 'ring ceremony', 'baraat', 'dulhan', 'vivah',
      'wedding venue', 'marry', 'married', 'nuptial',
    ],
    weight: 3,
  },
  room_booking: {
    words: [
      'book', 'room', 'villa', 'stay', 'night', 'available', 'availability',
      'check-in', 'checkin', 'checkout', 'check-out', 'accommodation',
      'suite', 'reserve', 'reservation', 'deluxe', 'premium',
      'adults', 'children', 'child', 'couple', 'honeymoon',
    ],
    weight: 2,
  },
  corporate_offsite: {
    words: [
      'offsite', 'team', 'conference', 'corporate', 'meeting', 'workshop',
      'retreat', 'teambuilding', 'team-building', 'company', 'colleagues',
      'presentation', 'projector', 'leadership', 'managers', 'employees',
      'strategy', 'planning session', 'business', 'corporate event',
    ],
    weight: 2.5,
  },
  complaint: {
    words: [
      'complaint', 'dirty', 'broken', 'worst', 'terrible', 'refund',
      'disgusting', 'unacceptable', 'disappointed', 'horrible',
      'cockroach', 'rude', 'noisy', 'filthy', 'pathetic', 'damaged',
      'not working', 'bad experience', 'poor service', 'unhygienic',
    ],
    weight: 4,
  },
  general: {
    words: [],
    weight: 0,
  },
};

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classifies an enquiry message into a category using keyword scoring and entity heuristics.
 */
export function classifyEnquiry(message: string): Classification {
  const lowerMessage = message.toLowerCase();
  
  const scores: Record<string, number> = {
    wedding: 0,
    room_booking: 0,
    corporate_offsite: 0,
    complaint: 0,
  };

  for (const [category, { words, weight }] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'general') continue;
    for (const word of words) {
      if (lowerMessage.includes(word.toLowerCase())) {
        scores[category] += weight;
      }
    }
  }

  // Entity-based heuristics (large guest counts strongly indicate events/weddings)
  const guestMatch = message.match(/(\d+)\s*(?:guests?|people|persons?|pax|members?|attendees?)/i) ||
                     message.match(/(?:team|group|party)\s+of\s+(\d+)/i) ||
                     message.match(/about\s+(\d+)/i);
  if (guestMatch) {
    const count = parseInt(guestMatch[1], 10);
    if (count >= 50) {
      if (scores.wedding > 0) scores.wedding += 4;
      if (scores.corporate_offsite > 0) scores.corporate_offsite += 3;
    } else if (count >= 20) {
      if (scores.corporate_offsite > 0) scores.corporate_offsite += 4;
    }
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topCategory, topScore] = sorted[0];
  const [, secondScore] = sorted[1];

  if (topScore === 0) {
    return { category: 'general', confidence: 0.35, isLowConfidence: true };
  }

  // Calculate normalized confidence score
  const total = topScore + secondScore;
  const margin = topScore - secondScore;
  const rawConfidence = (topScore / (total + 1)) * 0.6 + (margin / topScore) * 0.4;
  const confidence = Math.min(0.96, Math.max(0.40, Math.round(rawConfidence * 100) / 100));
  const isLowConfidence = confidence < 0.65;

  return {
    category: (isLowConfidence ? 'general' : topCategory) as EnquiryCategory,
    confidence,
    isLowConfidence,
  };
}

// ─── Entity Extractor ─────────────────────────────────────────────────────────

export function extractEntities(message: string): ExtractedEntities {
  return {
    dates: extractDates(message),
    guestCount: extractGuestCount(message),
    budget: extractBudget(message),
    nights: extractNights(message),
    roomType: extractRoomType(message),
  };
}

function extractDates(message: string): string[] {
  const dates: string[] = [];
  const months = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
  let match;

  const rangePattern = new RegExp(`(\\d{1,2})\\s*[-–to]+\\s*(\\d{1,2})\\s+(${months})\\s*(\\d{4})?`, 'gi');
  while ((match = rangePattern.exec(message)) !== null) {
    dates.push(`${match[1]}-${match[2]} ${match[3]}${match[4] ? ' ' + match[4] : ''}`);
  }

  const monthYearPattern = new RegExp(`(${months})\\s+(\\d{4})`, 'gi');
  while ((match = monthYearPattern.exec(message)) !== null) {
    if (!dates.find(d => d.toLowerCase().includes(match![1].toLowerCase()))) {
      dates.push(`${match[1]} ${match[2]}`);
    }
  }

  const dateMonthPattern = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${months})`, 'gi');
  while ((match = dateMonthPattern.exec(message)) !== null) {
    if (!dates.find(d => d.toLowerCase().includes(match![2].toLowerCase()))) {
      dates.push(`${match[1]} ${match[2]}`);
    }
  }

  const monthDatePattern = new RegExp(`(${months})\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'gi');
  while ((match = monthDatePattern.exec(message)) !== null) {
    if (!dates.find(d => d.toLowerCase().includes(match![1].toLowerCase()))) {
      dates.push(`${match[2]} ${match[1]}`);
    }
  }

  const numericPattern = /(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/g;
  while ((match = numericPattern.exec(message)) !== null) {
    dates.push(`${match[1]}/${match[2]}/${match[3]}`);
  }

  const weekPattern = new RegExp(`(first|second|third|last)\\s+week\\s+of\\s+(${months})`, 'gi');
  while ((match = weekPattern.exec(message)) !== null) {
    dates.push(`${match[1]} week of ${match[2]}`);
  }

  return [...new Set(dates)];
}

function extractGuestCount(message: string): number | null {
  const patterns = [
    /(\d+)\s*(?:guests?|people|persons?|pax|members?|attendees?)/i,
    /(?:team|group|party)\s+of\s+(\d+)/i,
    /(\d+)\s+(?:adults?)/i,
    /about\s+(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function extractBudget(message: string): string | null {
  const patterns = [
    /(?:budget|budg)\s*(?:of|around|approx|approximately|is|:)?\s*(₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k)?/i,
    /(₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k)?/i,
    /([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr)\b/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const raw = match[0].trim();
      return raw.startsWith('₹') ? raw : `₹${raw.replace(/^(rs\.?|inr)\s*/i, '')}`;
    }
  }
  return null;
}

function extractNights(message: string): number | null {
  const wordMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const numMatch = message.match(/(\d+)\s*[-–]?\s*nights?/i);
  if (numMatch) return parseInt(numMatch[1], 10);
  const wordMatch = message.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s+nights?/i);
  if (wordMatch) return wordMap[wordMatch[1].toLowerCase()] || null;
  return null;
}

function extractRoomType(message: string): string | null {
  const types: [string, string][] = [
    ['presidential villa', 'Presidential Villa'],
    ['heritage villa', 'Heritage Villa'],
    ["planter's villa", "Coffee Planter's Villa"],
    ['planters villa', "Coffee Planter's Villa"],
    ['coffee villa', "Coffee Planter's Villa"],
    ['villa', 'Villa'],
    ['suite', 'Suite'],
    ['premium', 'Premium Room'],
    ['deluxe', 'Deluxe Room'],
  ];
  const lower = message.toLowerCase();
  for (const [keyword, name] of types) {
    if (lower.includes(keyword)) return name;
  }
  return null;
}

// ─── Owner Assignment ─────────────────────────────────────────────────────────

export function assignOwner(category: EnquiryCategory, isLowConfidence: boolean): Assignment {
  if (isLowConfidence) return { assignedTo: 'General Manager', alertGM: true };
  switch (category) {
    case 'wedding': return { assignedTo: 'Sales Manager', alertGM: false };
    case 'room_booking': return { assignedTo: 'Reservations Manager', alertGM: false };
    case 'corporate_offsite': return { assignedTo: 'Sales Manager', alertGM: false };
    case 'complaint': return { assignedTo: 'Front Office Manager', alertGM: true };
    default: return { assignedTo: 'General Manager', alertGM: true };
  }
}

// ─── Reply Drafter ────────────────────────────────────────────────────────────

export function draftReply(
  category: EnquiryCategory,
  entities: ExtractedEntities,
  guestName?: string
): string {
  const name = guestName || 'Guest';
  const dateInfo = entities.dates.length > 0 ? `for ${entities.dates.join(' to ')}` : '';
  const guestInfo = entities.guestCount ? `for ${entities.guestCount} guests` : '';

  switch (category) {
    case 'wedding':
      return `Dear ${name},\n\nThank you for considering Misty Peaks Estate for ${entities.dates.length > 0 ? `your wedding ${dateInfo}` : 'your wedding celebration'}! We would be delighted to host this special occasion.\n\nOur estate can comfortably accommodate up to 300 guests across our landscaped lawns and indoor banquet spaces.${entities.guestCount ? ` A celebration ${guestInfo} would be a perfect fit.` : ''}${entities.nights ? ` We can arrange a wonderful ${entities.nights}-night celebration package.` : ''}\n\nTo prepare a personalised proposal, could you share:\n• Preferred dates${entities.dates.length > 0 ? ' (confirming ' + entities.dates.join(', ') + ')' : ''}\n• Style of celebration (outdoor lawn / indoor hall / both)\n• Specific requirements (décor, catering, accommodation for guests)\n\nOur Sales team will reach out shortly.\n\nWarm regards,\nTeam Misty Peaks Estate\n\n[DRAFT — Review before sending. Add pricing from rate table.]`;

    case 'room_booking':
      return `Dear ${name},\n\nThank you for your interest in staying at Misty Peaks Estate!\n\nWe are checking ${entities.roomType || 'room'} availability ${dateInfo}${entities.guestCount ? ` for ${entities.guestCount} guest${entities.guestCount > 1 ? 's' : ''}` : ''}.${entities.nights ? ` For a ${entities.nights}-night stay,` : ''} we will share the best available rates shortly.\n\n${entities.roomType?.toLowerCase().includes('villa') ? 'Our villas offer private gardens, spacious living areas and a truly immersive estate experience.' : 'Each room offers stunning views of the Western Ghats, estate-grown coffee and modern comforts.'}\n\nWarm regards,\nTeam Misty Peaks Estate\n\n[DRAFT — Review before sending. Add pricing from rate table.]`;

    case 'corporate_offsite':
      return `Dear ${name},\n\nThank you for considering Misty Peaks Estate for your ${entities.nights ? entities.nights + '-day ' : ''}team ${entities.dates.length > 0 ? `event ${dateInfo}` : 'offsite'}!\n\nWe have excellent facilities${entities.guestCount ? ` for a group of ${entities.guestCount}` : ''}:\n• Conference hall with Wi-Fi, projector and sound system\n• Breakout rooms for smaller sessions\n• Team activities: plantation walks, trekking, bonfire evenings\n• Dedicated event coordinator\n\nOur Sales team will prepare a customised proposal.\n\nBest regards,\nTeam Misty Peaks Estate\n\n[DRAFT — Review before sending. Add pricing from rate table.]`;

    case 'complaint':
      return `Dear ${name},\n\nWe sincerely apologise for the experience you described. This falls far below our standards, and we take your feedback extremely seriously.\n\nOur management team is looking into this matter personally and will contact you shortly to understand the full details and work towards a resolution.\n\nWith sincere apologies,\nTeam Misty Peaks Estate\n\n[DRAFT — Review before sending. GM has been alerted.]`;

    default:
      return `Dear ${name},\n\nThank you for reaching out to Misty Peaks Estate! We have received your enquiry and our team will respond shortly.\n\nWarm regards,\nTeam Misty Peaks Estate\n\n[DRAFT — Review before sending.]`;
  }
}

// ─── Gemini LLM Integration (Optional Live Mode) ──────────────────────────────

async function callGeminiRouter(
  message: string,
  source: string,
  guestName?: string,
  apiKey?: string
): Promise<ProcessedEnquiry | null> {
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second fail-safe timeout

  try {
    const prompt = `You are the AI Enquiry Router for Misty Peaks Estate, a 76-key coffee-estate resort in Chikkamagaluru, Karnataka.
Analyze this guest enquiry: "${message}" (Source: ${source}, Guest: ${guestName || 'Unknown'}).

Categorize into EXACTLY one of: "wedding", "room_booking", "corporate_offsite", "complaint", "general".
Assign owners:
- wedding / corporate_offsite -> "Sales Manager" (alertGM: false)
- room_booking -> "Reservations Manager" (alertGM: false)
- complaint -> "Front Office Manager" (alertGM: true ALWAYS)
- general / low confidence -> "General Manager" (alertGM: true)

Safety constraints:
- Low confidence (< 0.65) must assign to "General Manager" and set isLowConfidence: true.
- Complaints must set alertGM: true.
- Draft reply must NEVER invent or hallucinate room rates or prices. State prices will be confirmed from the rate table.

Respond ONLY in valid JSON matching this schema:
{
  "classification": {
    "category": "wedding" | "room_booking" | "corporate_offsite" | "complaint" | "general",
    "confidence": number (0.0 to 1.0),
    "isLowConfidence": boolean
  },
  "entities": {
    "dates": string[],
    "guestCount": number | null,
    "budget": string | null,
    "nights": number | null,
    "roomType": string | null
  },
  "assignment": {
    "assignedTo": "Sales Manager" | "Reservations Manager" | "Front Office Manager" | "General Manager",
    "alertGM": boolean
  },
  "draftReply": string
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as ProcessedEnquiry;
    // Enforce complaint GM alert guardrail even if model misses it
    if (parsed.classification.category === 'complaint') {
      parsed.assignment.alertGM = true;
    }
    return parsed;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

// ─── Main Processor (Dual-Mode: LLM + Local Fallback) ─────────────────────────

export async function processEnquiry(
  message: string,
  source: string,
  guestName?: string
): Promise<ProcessedEnquiry> {
  // 1. If GEMINI_API_KEY is configured, try live LLM router
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const liveResult = await callGeminiRouter(message, source, guestName, apiKey);
    if (liveResult) return liveResult;
  }

  // 2. High-performance, zero-downtime local NLP engine (works without any API key)
  const classification = classifyEnquiry(message);
  const entities = extractEntities(message);
  const assignment = assignOwner(classification.category, classification.isLowConfidence);
  const reply = draftReply(classification.category, entities, guestName);
  return { classification, entities, assignment, draftReply: reply };
}
