/**
 * OpenSearch driver fritextsökningen. Klustret indexerar ett dokument per
 * artikel i littb-live_sol, med artikeltexten och medarbetarnas namn
 * analyserade, och verken inbäddade som en lista på artikeln.
 */

let config = null

function opensearchConfig() {
    if (!config) {
        const runtime = useRuntimeConfig()
        const url = String(runtime.opensearchUrl || '').replace(/\/+$/, '')
        const index = String(runtime.opensearchIndex || '')
        if (!url || !index) {
            throw createError({
                statusCode: 500,
                statusMessage: 'OpenSearch is not configured',
                message: 'Sätt NUXT_OPENSEARCH_URL och NUXT_OPENSEARCH_INDEX i miljön.'
            })
        }
        const auth = runtime.opensearchAuth ? { Authorization: `Basic ${btoa(runtime.opensearchAuth)}` } : {}
        config = { url, index, headers: { 'Content-Type': 'application/json', ...auth } }
    }
    return config
}

export async function opensearchSearch(body) {
    const { url, index, headers } = opensearchConfig()
    try {
        return await $fetch(`/${index}/_search`, { baseURL: url, method: 'POST', headers, body })
    } catch (error) {
        const detail = error?.data?.error?.reason || error?.message || 'okänt fel'
        throw createError({
            statusCode: 502,
            statusMessage: 'OpenSearch request failed',
            message: `OpenSearch ${index}: ${detail}`
        })
    }
}

/**
 * Artiklar som matchar en fras, rankade på relevans. Namnet väger tyngst,
 * sedan brödtexten och medarbetarnas namn, som i den gamla poängformeln.
 */
export async function searchArticles(phrase, { size = 20, publishedOnly = true } = {}) {
    const must = {
        multi_match: {
            query: phrase,
            fields: [
                'article.ArticleName^4',
                'article.ArticleName.search^2',
                'article.ArticleText',
                'article.ArticleText.search^0.5',
                'contributors.FirstName',
                'contributors.LastName'
            ],
            operator: 'and'
        }
    }
    const body = {
        size,
        _source: ['article.id', 'article.ArticleName', 'article.URLName', 'article.Type', 'article.TranslatorYearBirth', 'article.TranslatorYearDeath'],
        query: publishedOnly ? { bool: { must, filter: [{ term: { 'article.Status': 3 } }] } } : must
    }
    const response = await opensearchSearch(body)
    return (response?.hits?.hits ?? []).map(hit => ({ ...hit._source.article, _score: hit._score }))
}

/**
 * Stavningsförslag, som ersätter hunspell i Python-API:t. Termförslagen
 * kommer ur artikeltexten, så de är begränsade till lexikonets eget ordförråd.
 */
export async function spellingSuggestion(phrase) {
    const words = String(phrase).split(/\s+/).filter(Boolean)
    if (!words.length) return ''
    const suggest = {}
    words.forEach((word, index) => {
        suggest[`w${index}`] = { text: word, term: { field: 'article.ArticleText', suggest_mode: 'missing' } }
    })
    const response = await opensearchSearch({ size: 0, suggest })
    let changed = false
    const corrected = words.map((word, index) => {
        const option = response?.suggest?.[`w${index}`]?.[0]?.options?.[0]
        if (option?.text && option.text.toLowerCase() !== word.toLowerCase()) {
            changed = true
            return option.text
        }
        return word
    })
    return changed ? corrected.join(' ') : ''
}
