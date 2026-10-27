import { onCall, HttpsError } from 'firebase-functions/v2/https';

type NarrateStop = { id?: string; name?: string; kind?: string; tip?: string };

const GEMINI_MODEL = 'gemini-2.5-flash';

function descriptionsFromText(content: string): Record<string, string> | null {
  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const raw = JSON.parse(trimmed) as Record<string, unknown>;
  const descriptions = Object.fromEntries(
    Object.entries(raw)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
      .map(([id, text]) => [id, text.trim().slice(0, 180)])
  );
  return Object.keys(descriptions).length > 0 ? descriptions : null;
}

export const narrateTrip = onCall({ region: 'asia-south1', timeoutSeconds: 20 }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in to polish a trip with AI.');
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { descriptions: null as Record<string, string> | null, reason: 'no_key' };

  const body = (request.data ?? {}) as { lang?: string; stops?: NarrateStop[] };
  const stops = Array.isArray(body.stops) ? body.stops.slice(0, 60) : [];
  if (stops.length === 0) return { descriptions: null, reason: 'empty' };

  const lang = body.lang === 'ta' ? 'Tamil' : 'English';
  const prompt = [
    `Write one short sentence in ${lang} for each stop.`,
    'Use only the town names and place names already in each stop name.',
    'Never invent a town, restaurant, hotel, or attraction.',
    'If the name is already "Dinner near Ulundurpet – Some Hotel", keep that town and that place.',
    'Return a JSON object whose keys are the stop ids and whose values are the sentences.',
    'Do not change times or add stops. Keep each sentence under 180 characters.',
    JSON.stringify(
      stops.map((stop) => ({
        id: String(stop.id ?? ''),
        name: String(stop.name ?? ''),
        kind: String(stop.kind ?? ''),
        tip: String(stop.tip ?? ''),
      }))
    ),
  ].join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    }
  );
  if (!response.ok) return { descriptions: null, reason: 'upstream' };

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  try {
    return { descriptions: descriptionsFromText(text), reason: 'ok' };
  } catch {
    return { descriptions: null, reason: 'parse' };
  }
});
