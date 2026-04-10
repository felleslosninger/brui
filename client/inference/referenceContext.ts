import type { ContextValue, JsonObject, JsonValue } from '../types';

const maxReferenceContextChars = 12_000;
const maxReferenceContentChars = 1_400;
const maxReferenceResults = 6;
const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'det',
    'den',
    'der',
    'dere',
    'deg',
    'do',
    'does',
    'du',
    'då',
    'eller',
    'en',
    'er',
    'et',
    'explain',
    'for',
    'forklar',
    'forklare',
    'fortell',
    'fra',
    'har',
    'have',
    'how',
    'hvorfor',
    'hva',
    'hvor',
    'hvordan',
    'hvilken',
    'hvilke',
    'i',
    'if',
    'in',
    'is',
    'it',
    'jeg',
    'kan',
    'man',
    'med',
    'of',
    'og',
    'om',
    'or',
    'please',
    'på',
    'si',
    'som',
    'that',
    'the',
    'tell',
    'this',
    'til',
    'to',
    'vis',
    'was',
    'what',
    'when',
    'where',
    'which',
    'with',
]);

export interface ReferenceSource {
    title: string;
    path?: string;
    lang?: string;
}

export interface ReferenceContextUsage {
    used: boolean;
    label: string;
    sources: ReferenceSource[];
}

export interface PreparedReferenceContext extends ReferenceContextUsage {
    prompt: string;
}

export function prepareReferenceContext(
    context: ContextValue | undefined,
    query: string
): PreparedReferenceContext | null {
    if (!hasReferenceContext(context)) {
        return null;
    }

    if (context == null) {
        return null;
    }

    if (looksLikeSearchIndex(context)) {
        return prepareSearchIndexReferenceContext(context, query);
    }

    const prompt = formatGenericReferenceContext(context);
    if (!prompt) {
        return null;
    }

    return {
        used: true,
        label: 'Consulted provided context',
        sources: [{ title: 'Provided context' }],
        prompt,
    };
}

export function appendReferenceSources(
    content: string,
    referenceContext?: ReferenceContextUsage | null
): string {
    const trimmedContent = content.trim();

    if (!referenceContext?.used || referenceContext.sources.length === 0) {
        return trimmedContent;
    }

    const sourcesBlock = [
        'Sources:',
        ...referenceContext.sources.map(formatReferenceSource),
    ].join('\n');

    return trimmedContent
        ? `${trimmedContent}\n\n${sourcesBlock}`
        : sourcesBlock;
}

function prepareSearchIndexReferenceContext(
    entries: JsonObject[],
    query: string
): PreparedReferenceContext | null {
    const selectedEntries = selectRelevantSearchIndexEntries(entries, query);
    if (selectedEntries.length === 0) {
        return null;
    }

    const sources = selectedEntries.map((entry, index) => ({
        title: typeof entry.title === 'string' ? entry.title : `Document ${index + 1}`,
        ...(typeof entry.path === 'string' ? { path: entry.path } : {}),
        ...(typeof entry.lang === 'string' ? { lang: entry.lang } : {}),
    }));

    const prompt = truncateText(
        [
            `Selected ${selectedEntries.length} relevant document excerpt(s) from the provided reference context.`,
            selectedEntries
                .map((entry, index) => {
                    const title = typeof entry.title === 'string' ? entry.title : `Document ${index + 1}`;
                    const path = typeof entry.path === 'string' ? entry.path : null;
                    const lang = typeof entry.lang === 'string' ? entry.lang : null;
                    const content = typeof entry.content === 'string'
                        ? truncateText(entry.content, maxReferenceContentChars)
                        : '';

                    return [
                        `Document ${index + 1}`,
                        `title: ${title}`,
                        path ? `path: ${path}` : null,
                        lang ? `lang: ${lang}` : null,
                        'content:',
                        content,
                    ]
                        .filter((line): line is string => Boolean(line))
                        .join('\n');
                })
                .join('\n\n'),
        ].join('\n\n'),
        maxReferenceContextChars
    );

    return {
        used: true,
        label: `Consulted ${selectedEntries.length} reference doc${selectedEntries.length === 1 ? '' : 's'}`,
        sources,
        prompt,
    };
}

function formatGenericReferenceContext(context: ContextValue): string | null {
    if (typeof context === 'string') {
        return truncateText(context, maxReferenceContextChars);
    }

    try {
        return truncateText(JSON.stringify(context, null, 2), maxReferenceContextChars);
    } catch {
        return null;
    }
}

function hasReferenceContext(context?: ContextValue): boolean {
    if (context == null) {
        return false;
    }

    if (typeof context === 'string') {
        return context.trim().length > 0;
    }

    if (Array.isArray(context)) {
        return context.length > 0;
    }

    if (typeof context === 'object') {
        return Object.keys(context).length > 0;
    }

    return true;
}

function looksLikeSearchIndex(context: ContextValue): context is JsonObject[] {
    if (!Array.isArray(context) || context.length === 0) {
        return false;
    }

    return context
        .slice(0, Math.min(context.length, 5))
        .every(isSearchIndexEntry);
}

function isSearchIndexEntry(value: JsonValue): value is JsonObject {
    if (!isJsonObject(value)) {
        return false;
    }

    return typeof value.title === 'string' && typeof value.content === 'string';
}

function isJsonObject(value: JsonValue): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function selectRelevantSearchIndexEntries(entries: JsonObject[], query: string): JsonObject[] {
    const normalizedQuery = normalizeText(query);
    const queryTerms = extractQueryTerms(query);
    const queryPhrases = extractQueryPhrases(queryTerms);
    const documentFrequencies = buildDocumentFrequencies(entries, queryTerms);

    const scoredEntries = entries
        .map((entry, index) => ({
            entry,
            index,
            score: scoreSearchIndexEntry(
                entry,
                normalizedQuery,
                queryTerms,
                queryPhrases,
                documentFrequencies,
                entries.length
            ),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index);

    if (scoredEntries.length === 0) {
        return [];
    }

    const bestScore = scoredEntries[0].score;
    const minimumScore = Math.max(2, bestScore * 0.7);

    return scoredEntries
        .filter(({ score }) => score >= minimumScore)
        .slice(0, maxReferenceResults)
        .map(({ entry }) => entry);
}

function scoreSearchIndexEntry(
    entry: JsonObject,
    normalizedQuery: string,
    queryTerms: string[],
    queryPhrases: string[],
    documentFrequencies: Map<string, number>,
    totalEntries: number
): number {
    const title = typeof entry.title === 'string' ? normalizeText(entry.title) : '';
    const path = typeof entry.path === 'string' ? normalizeText(entry.path) : '';
    const content = typeof entry.content === 'string' ? normalizeText(entry.content) : '';
    const titleTokens = new Set(tokenize(typeof entry.title === 'string' ? entry.title : ''));
    const pathTokens = new Set(tokenize(typeof entry.path === 'string' ? entry.path : ''));
    const contentTokens = new Set(tokenize(typeof entry.content === 'string' ? entry.content : ''));

    let score = 0;

    if (normalizedQuery) {
        if (title.includes(normalizedQuery)) {
            score += 28;
        }

        if (path.includes(normalizedQuery)) {
            score += 22;
        }

        if (content.includes(normalizedQuery)) {
            score += 18;
        }
    }

    for (const phrase of queryPhrases) {
        if (title.includes(phrase)) {
            score += 18;
        }

        if (path.includes(phrase)) {
            score += 14;
        }

        if (content.includes(phrase)) {
            score += 12;
        }
    }

    for (const term of queryTerms) {
        const rarity = getTermRarity(term, documentFrequencies, totalEntries);

        if (titleTokens.has(term)) {
            score += 12 * rarity;
        }

        if (pathTokens.has(term)) {
            score += 10 * rarity;
        }

        if (contentTokens.has(term)) {
            score += 7 * rarity;
        }
    }

    return score;
}

function extractQueryTerms(query: string): string[] {
    const tokens = tokenize(query);
    return [...new Set(tokens.filter((token) => token.length >= 3 && !stopWords.has(token)))];
}

function extractQueryPhrases(queryTerms: string[]): string[] {
    const phrases: string[] = [];

    for (let index = 0; index < queryTerms.length - 1; index++) {
        phrases.push(`${queryTerms[index]} ${queryTerms[index + 1]}`);
    }

    for (let index = 0; index < queryTerms.length - 2; index++) {
        phrases.push(`${queryTerms[index]} ${queryTerms[index + 1]} ${queryTerms[index + 2]}`);
    }

    return [...new Set(phrases.filter((phrase) => phrase.length >= 8))];
}

function buildDocumentFrequencies(entries: JsonObject[], queryTerms: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const term of queryTerms) {
        let frequency = 0;

        for (const entry of entries) {
            const entryTokens = new Set(tokenize([
                typeof entry.title === 'string' ? entry.title : '',
                typeof entry.path === 'string' ? entry.path : '',
                typeof entry.content === 'string' ? entry.content : '',
            ].join(' ')));

            if (entryTokens.has(term)) {
                frequency += 1;
            }
        }

        frequencies.set(term, frequency);
    }

    return frequencies;
}

function getTermRarity(
    term: string,
    documentFrequencies: Map<string, number>,
    totalEntries: number
): number {
    const frequency = documentFrequencies.get(term) || 0;
    return Math.max(1, Math.log((totalEntries + 1) / (frequency + 1)) + 1);
}

function tokenize(text: string | undefined): string[] {
    return normalizeText(text || '').match(/[\p{L}\p{N}_-]+/gu) || [];
}

function normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function truncateText(value: string, maxChars: number): string {
    if (value.length <= maxChars) {
        return value;
    }

    return `${value.slice(0, maxChars - 15)}\n\n[truncated]`;
}

function formatReferenceSource(source: ReferenceSource): string {
    const parts = [source.title];

    if (source.path) {
        parts.push(`(${source.path})`);
    }

    if (source.lang) {
        parts.push(`[${source.lang}]`);
    }

    return `- ${parts.join(' ')}`;
}
