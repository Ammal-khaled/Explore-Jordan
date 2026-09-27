const MODEL = 'gemini-3.8-flash';
const MAX_REQUEST_BYTES = 80_000;
const MAX_SESSION_REQUESTS = 20;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are the Explore Jordan Trip Advisor, an AI travel assistant for a Jordan
tourism platform.

YOUR JOB
Help visitors plan a trip to Jordan by asking about their budget, trip
length, interests, and travel style, then recommending destinations,
activities, and accommodations that fit.

DATA YOU MUST USE
You will be given a JSON list of real destinations, activities, and
accommodations available on the platform (name, city, category, price range,
tags, description, links). Only recommend places from this provided list.
Never invent a hotel, attraction, or activity that isn't in the data. If
nothing in the data fits the user's request well, say so honestly and
suggest the closest available alternative instead of making something up.

BUDGET AWARENESS
Price ranges are $ (budget), $$ (mid-range), $$$ (comfort/luxury). Always
ask for or confirm the user's budget level before recommending, and never
recommend something above their stated budget unless you flag it clearly as
a splurge option.

STYLE
- Keep responses short and conversational, like a knowledgeable local
  friend, not a formal travel brochure.
- Ask one clarifying question at a time if you're missing budget, trip
  length, or interests — don't interrogate with a list of questions at once.
- When you recommend a place, briefly say why it fits what they asked for.
- Always include the accommodation's booking link when recommending a stay,
  and the map/official link when recommending a destination or activity.

OUTPUT FORMAT
When giving a concrete itinerary or shortlist, return it as both:
1. A short conversational summary.
2. A structured JSON block matching this shape, so the frontend can render
   cards:
{
  "recommendations": [
    { "type": "destination" | "activity" | "accommodation", "id": "...", "reason": "..." }
  ]
}
For general back-and-forth conversation (not a final recommendation), skip
the JSON block and just reply conversationally.

BOUNDARIES
- Only discuss travel in Jordan. Politely redirect if asked about unrelated
  topics.
- Don't give visa, legal, medical, or safety-critical advice beyond general
  public information; suggest official sources (embassy, government tourism
  board) for anything official.
- Don't discuss pricing beyond the platform's price-range tags — you don't
  have real-time prices.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const sessionRequests = new Map<string, { count: number; expiresAt: number }>();

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function enforceSessionCap(sessionId: string): boolean {
  const now = Date.now();
  for (const [key, session] of sessionRequests) {
    if (session.expiresAt <= now) sessionRequests.delete(key);
  }

  const current = sessionRequests.get(sessionId) || {
    count: 0,
    expiresAt: now + SESSION_TTL_MS,
  };
  if (current.count >= MAX_SESSION_REQUESTS) return false;
  current.count += 1;
  sessionRequests.set(sessionId, current);
  return true;
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function shortText(value: unknown, maxLength = 600): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, maxLength);
}

function sanitizeListing(value: unknown, type: string) {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = shortText(item.id, 100);
  const name = shortText(item.name, 160);
  if (!id || !name) return null;

  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((tag) => shortText(tag, 80))
        .filter(Boolean)
        .slice(0, 12)
    : [];
  return {
    type,
    id,
    name,
    city: shortText(item.city || item.location, 160),
    category: shortText(item.category || item.type, 100),
    priceRange: shortText(item.priceRange, 20),
    tags,
    description: shortText(item.longDescription || item.shortDescription, 700),
    bookingLink: safeHttpUrl(item.bookingLink),
    mapLink: safeHttpUrl(item.mapLink),
    officialLink: safeHttpUrl(item.officialLink),
  };
}

function extractResponse(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  let recommendations: Array<{ type: string; id: string; reason: string }> = [];
  let reply = text;

  if (start >= 0 && end > start) {
    const jsonBlock = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(jsonBlock);
      if (Array.isArray(parsed.recommendations)) {
        recommendations = parsed.recommendations
          .filter(
            (item: unknown) =>
              item &&
              typeof item === 'object' &&
              ['destination', 'activity', 'accommodation'].includes(
                (item as Record<string, unknown>).type as string
              ) &&
              typeof (item as Record<string, unknown>).id === 'string'
          )
          .map((item: Record<string, unknown>) => ({
            type: String(item.type),
            id: String(item.id).slice(0, 100),
            reason: shortText(item.reason, 400) || '',
          }));
        reply = `${text.slice(0, start)}${text.slice(end + 1)}`
          .replace(/```(?:json)?/gi, '')
          .trim();
      }
    } catch {
      // Keep the model's original conversational text if its JSON is malformed.
    }
  }

  return { text: reply || 'Here are a few ideas for your Jordan trip.', recommendations };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed', message: 'Use POST for trip advice.' });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return jsonResponse(503, {
      error: 'not_configured',
      message: 'The AI Trip Advisor is not configured yet.',
    });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(413, { error: 'request_too_large', message: 'Please shorten this chat.' });
  }

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return jsonResponse(413, {
        error: 'request_too_large',
        message: 'Please shorten this chat.',
      });
    }
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse(400, { error: 'invalid_json', message: 'The chat request was invalid.' });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse(400, { error: 'invalid_json', message: 'The chat request was invalid.' });
  }

  const sessionId = shortText(body.sessionId, 80);
  if (!sessionId || !/^[a-zA-Z0-9-]{8,80}$/.test(sessionId)) {
    return jsonResponse(400, { error: 'invalid_session', message: 'Please restart the chat.' });
  }
  if (!enforceSessionCap(sessionId)) {
    return jsonResponse(429, {
      error: 'session_limit',
      message: 'The advisor is busy. Please try again shortly.',
    });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-30) : [];
  if (!history.length) {
    return jsonResponse(400, { error: 'missing_history', message: 'Start with a trip question.' });
  }

  const contents = history
    .filter(
      (message): message is Record<string, unknown> =>
        Boolean(message) && typeof message === 'object'
    )
    .map((message) => ({
      role:
        message.role === 'assistant' || message.role === 'model' || message.role === 'bot'
          ? 'model'
          : 'user',
      parts: [{ text: shortText(message.content, 2000) || '' }],
    }))
    .filter((message) => message.parts[0].text.length > 0);
  if (!contents.length) {
    return jsonResponse(400, { error: 'missing_history', message: 'Start with a trip question.' });
  }

  const rawListings = body.listings as Record<string, unknown> | undefined;
  const listings = {
    destinations: (Array.isArray(rawListings?.destinations) ? rawListings.destinations : [])
      .slice(0, 40)
      .map((item) => sanitizeListing(item, 'destination'))
      .filter(Boolean),
    activities: (Array.isArray(rawListings?.activities) ? rawListings.activities : [])
      .slice(0, 40)
      .map((item) => sanitizeListing(item, 'activity'))
      .filter(Boolean),
    accommodations: (Array.isArray(rawListings?.accommodations) ? rawListings.accommodations : [])
      .slice(0, 30)
      .map((item) => sanitizeListing(item, 'accommodation'))
      .filter(Boolean),
  };
  if (
    !listings.destinations.length &&
    !listings.activities.length &&
    !listings.accommodations.length
  ) {
    return jsonResponse(400, {
      error: 'missing_listings',
      message: 'Jordan listings are unavailable.',
    });
  }

  const lastTurn = contents[contents.length - 1];
  if (lastTurn.role === 'user') {
    lastTurn.parts[0].text += `\n\nPlatform listings JSON for this reply:\n${JSON.stringify(listings)}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: `Platform listings JSON for this reply:\n${JSON.stringify(listings)}` }],
    });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 1200,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: AbortSignal.timeout(25_000),
      }
    );

    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429) {
        return jsonResponse(429, {
          error: 'quota_exceeded',
          message: 'The AI Trip Advisor is busy right now. Please try again shortly.',
        });
      }
      const status = geminiResponse.status >= 500 ? 503 : 502;
      return jsonResponse(status, {
        error: 'gemini_request_failed',
        message: 'The AI Trip Advisor is temporarily unavailable.',
      });
    }

    const result = await geminiResponse.json();
    const responseText = (result.candidates?.[0]?.content?.parts || [])
      .map((part: Record<string, unknown>) => (typeof part.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
    if (!responseText) {
      return jsonResponse(502, {
        error: 'empty_response',
        message: 'The AI Trip Advisor could not form a reply. Please try again.',
      });
    }

    return jsonResponse(200, extractResponse(responseText));
  } catch (error) {
    console.error(
      'Gemini request failed:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return jsonResponse(503, {
      error: 'upstream_unavailable',
      message: 'The AI Trip Advisor is temporarily unavailable.',
    });
  }
});
