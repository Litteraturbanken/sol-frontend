<template>
  <div class="librisimport">
    <header class="tool-head">
      <h2>Librisimport</h2>
      <p v-if="editor" class="who">{{ editor.name }} · <button class="link-action" @click="logout">Logga ut</button></p>
    </header>

    <!-- Inloggning med Directus-konto -->
    <form v-if="editor === false" class="login" @submit.prevent="login">
      <p class="hint">Logga in med ditt konto i Directus (sol-admin.lb.se).</p>
      <label class="field"><span>E-post</span><input v-model="email" class="input" type="email" autocomplete="username" required /></label>
      <label class="field"><span>Lösenord</span><input v-model="password" class="input" type="password" autocomplete="current-password" required /></label>
      <button class="action primary" type="submit" :disabled="busy">Logga in</button>
      <p v-if="error" class="notice error">{{ error }}</p>
    </form>

    <template v-else-if="editor">
      <div class="row setup">
        <section class="col-md-6 step">
          <h4>1. Artikel</h4>
          <p class="hint">Verken kopplas till den här artikeln.</p>
          <div v-if="!article" class="picker">
            <input v-model="articleQuery" class="input wide" type="search" placeholder="Sök översättare eller artikel" @input="findArticles" />
            <ul v-if="articleHits.length" class="hits">
              <li v-for="a in articleHits" :key="a.id">
                <a href="#" @click.prevent="chooseArticle(a)">{{ a.ArticleName }}</a>
                <span v-if="a.TranslatorYearBirth" class="muted"> {{ a.TranslatorYearBirth }}–{{ a.TranslatorYearDeath }}</span>
                <span v-if="Number(a.Status) !== 3" class="flag">ej publicerad</span>
              </li>
            </ul>
          </div>
          <p v-else class="chosen">
            <strong>{{ article.ArticleName }}</strong>
            <button class="link-action" @click="clearArticle">Byt</button>
          </p>
          <label class="field">
            <span>Koppling</span>
            <select v-model="connection" class="input">
              <option v-for="(c, value) in CONNECTIONS" :key="value" :value="value">{{ c.label }}</option>
            </select>
          </label>
        </section>

        <section class="col-md-6 step">
          <h4>2. Sök i Libris</h4>
          <form class="search" @submit.prevent="search">
            <input v-model="query" class="input wide" type="search" placeholder="Författare eller titel, t.ex. Almqvist" />
            <button class="action" type="submit" :disabled="busy || !query.trim()">Sök</button>
          </form>
          <p class="options">
            <label><input v-model="booksOnly" type="checkbox" /> Endast böcker</label>
            <label><input v-model="swedishOnly" type="checkbox" /> Endast svenska</label>
          </p>
          <p v-if="lastQuery" class="hint">{{ records.length }} av {{ total }} träffar för <code>{{ lastQuery }}</code></p>
        </section>
      </div>

      <p v-if="message" class="notice" :class="{ error: messageIsError }">{{ message }}</p>

      <section v-if="records.length" class="results">
        <div class="toolbar">
          <span class="count">{{ selected.length }} markerade</span>
          <button class="link-action" @click="selectAll(true)">Markera alla</button>
          <button class="link-action" :disabled="!selected.length" @click="selectAll(false)">Avmarkera</button>
          <button class="link-action" :disabled="selected.length < 2" @click="openDetails(selectedIndexes)">Jämför markerade</button>
          <button class="link-action" :disabled="!selected.length" @click="removeSelected">Ta bort markerade</button>
          <button class="link-action" :disabled="!records.some(isDupe)" @click="removeDupes">Ta bort dubbletter</button>
          <button class="action primary" :disabled="!article || !selected.length || busy" @click="save">
            {{ article ? `Lägg till ${selected.length} verk` : 'Välj artikel först' }}
          </button>
        </div>

        <ul class="records">
          <li v-for="(record, index) in records" :key="record.libris + ':' + index"
              :class="{ existing: isDupe(record), selected: record._selected }">
            <input v-model="record._selected" type="checkbox" :disabled="isDupe(record)"
                   :title="isDupe(record) ? 'Verket finns redan i databasen.' : 'Markera'" />
            <div class="entry" @click="openDetails([index])">
              <div class="title">
                {{ shownTitle(record) }}<span v-if="record.title_subtitle" class="sub"> : {{ record.title_subtitle }}</span>
              </div>
              <div class="meta">{{ [record.author, publication(record)].filter(Boolean).join(' · ') }}</div>
              <div v-if="record._warnings.length || record._merged || anyDirty(record)" class="flags">
                <span v-for="w in record._warnings" :key="w" class="flag" :class="'f-' + w">{{ WARNINGS[w] }}</span>
                <span v-if="record._merged" class="flag f-merged">{{ record.publishings.length + 1 }} utgåvor</span>
                <span v-if="anyDirty(record)" class="flag f-merged">Ändrad</span>
              </div>
            </div>
            <span class="libris">{{ record.libris }}</span>
          </li>
        </ul>
      </section>

      <!-- Detaljer och jämförelse -->
      <div v-if="details.length" class="overlay" @click.self="closeDetails">
        <div class="dialog">
          <header>
            <h3>{{ details.length === 1 ? 'Detaljer' : `Jämför ${details.length} titlar` }}</h3>
            <button class="action" @click="closeDetails">Klar</button>
          </header>
          <p v-if="picking" class="notice">Klicka på det verk som ska behållas. De andra blir utgåvor av det.</p>
          <p v-else-if="details.length > 1">
            <button class="link-action" @click="picking = true">Slå ihop till ett verk med {{ details.length }} utgåvor</button>
          </p>
          <div class="columns">
            <div v-for="index in details" :key="index" class="column" :class="{ pickable: picking }" @click="picking && merge(index)">
              <table>
                <tr v-for="key in fieldsOf(records[index])" :key="key" :class="{ dirty: isDirty(records[index], key) }">
                  <th :title="key">{{ LABELS[key] || key }}</th>
                  <td><input v-model="records[index][key]" class="input" :disabled="key === 'libris' || picking" /></td>
                  <td class="reset"><button v-if="isDirty(records[index], key)" class="link-action" title="Återställ" @click="reset(records[index], key)">↺</button></td>
                </tr>
              </table>
              <div v-if="records[index].publishings?.length" class="publishings">
                <h4>Sammanslagna utgåvor</h4>
                <ul><li v-for="(p, i) in records[index].publishings" :key="i">{{ [p.publishing_place, p.publishing_house].filter(Boolean).join(' : ') }}{{ p.publishing_year ? ', ' + p.publishing_year : '' }}</li></ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { CONNECTIONS, LABELS, WARNINGS, prepareRecords } from '~/assets/libris'

useHead({ title: 'Librisimport', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const base = String(useRuntimeConfig().app.baseURL || '/').replace(/\/+$/, '')
const api = (path, options) => $fetch(base + '/api/redaktion' + path, options)
const errorText = e => e?.data?.message || e?.message || 'Något gick fel'
/** Felet visas; har sessionen gått ut visas inloggningen igen. */
function failed(e, prefix = '') {
  if (e?.response?.status === 401) {
    editor.value = false
    error.value = errorText(e) + '. Logga in igen.'
    return
  }
  say(prefix + errorText(e), true)
}

const editor = ref(null)
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const message = ref('')
const messageIsError = ref(false)

const articleQuery = ref('')
const articleHits = ref([])
const article = ref(null)
const connection = ref('1')

const query = ref('')
const booksOnly = ref(true)
const swedishOnly = ref(true)
const lastQuery = ref('')
const total = ref(0)
const records = ref([])
const originals = new Map()

const details = ref([])
const picking = ref(false)

const selected = computed(() => records.value.filter(r => r._selected && !isDupe(r)))
const selectedIndexes = computed(() => records.value.map((r, i) => (r._selected ? i : -1)).filter(i => i >= 0))

function isDupe(record) {
  return record._warnings.includes('dupe')
}
function fieldsOf(record) {
  return Object.keys(LABELS).filter(key => key in record || ['author', 'title_main', 'publishing_year', 'lang_this'].includes(key))
}
function isDirty(record, key) {
  const original = originals.get(record)
  return original !== undefined && (record[key] ?? '') !== (original[key] ?? '')
}
function anyDirty(record) {
  return Object.keys(LABELS).some(key => isDirty(record, key))
}
/** Titeln utan Libris avslutande " :" eller " /", som annars dubbleras i listan. */
function shownTitle(record) {
  return String(record.title_main || '(utan titel)').replace(/\s*[:/]\s*$/, '')
}
/** Utgivningen som i en litteraturreferens: "Ort : Förlag, år". */
function publication(record) {
  const where = [record.publishing_place, record.publishing_house].filter(Boolean).join(' : ')
  return [where, record.publishing_year].filter(Boolean).join(', ')
}
function reset(record, key) {
  record[key] = originals.get(record)?.[key]
}
function say(text, isError = false) {
  message.value = text
  messageIsError.value = isError
}

onMounted(async () => {
  try {
    editor.value = await api('/me')
  } catch {
    editor.value = false
  }
})

async function login() {
  busy.value = true
  error.value = ''
  try {
    editor.value = await api('/login', { method: 'POST', body: { email: email.value, password: password.value } })
    password.value = ''
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}

async function logout() {
  await api('/logout', { method: 'POST' }).catch(() => {})
  editor.value = false
}

let articleTimer = null
function findArticles() {
  article.value = null
  clearTimeout(articleTimer)
  articleTimer = setTimeout(async () => {
    const q = articleQuery.value.trim()
    if (q.length < 2) {
      articleHits.value = []
      return
    }
    try {
      articleHits.value = (await api('/articles', { query: { q } })).articles
    } catch (e) {
      articleHits.value = []
      failed(e, 'Artiklarna kunde inte hämtas: ')
    }
  }, 200)
}
function chooseArticle(a) {
  article.value = a
  articleQuery.value = a.ArticleName
  articleHits.value = []
}
function clearArticle() {
  article.value = null
  articleQuery.value = ''
}

async function search() {
  if (!query.value.trim()) return
  busy.value = true
  say('Söker i Libris …')
  try {
    const result = await api('/libris/search', {
      query: { q: query.value, swe: swedishOnly.value ? '1' : '0', books: booksOnly.value ? '1' : '0' }
    })
    records.value = prepareRecords(result.records, result.existing)
    // Originalen för "ändrat" och återställning, nycklade på listans reaktiva objekt.
    originals.clear()
    for (const r of records.value) originals.set(r, { ...r })
    lastQuery.value = result.query
    total.value = result.total
    say('')
  } catch (e) {
    failed(e)
  } finally {
    busy.value = false
  }
}

function selectAll(value) {
  for (const r of records.value) if (!isDupe(r)) r._selected = value
}
function removeSelected() {
  records.value = records.value.filter(r => !r._selected)
}
function removeDupes() {
  records.value = records.value.filter(r => !isDupe(r))
}
function openDetails(indexes) {
  details.value = indexes
  picking.value = false
}
function closeDetails() {
  details.value = []
  picking.value = false
}

/** Behåller verket keep; de andra jämförda blir dess utgåvor och tas bort ur listan. */
function merge(keep) {
  const kept = records.value[keep]
  const others = details.value.filter(i => i !== keep).map(i => records.value[i])
  kept.publishings = [...(kept.publishings || []), ...others.map(o => ({
    publishing_house: o.publishing_house, publishing_place: o.publishing_place, publishing_year: o.publishing_year
  }))]
  kept._merged = true
  kept._selected = true
  records.value = records.value.filter(r => !others.includes(r))
  closeDetails()
}

async function save() {
  busy.value = true
  say('Sparar …')
  const chosen = selected.value
  const payload = chosen.map(r => {
    const out = { warnings: r._warnings }
    for (const [key, value] of Object.entries(r)) if (!key.startsWith('_')) out[key] = value
    return out
  })
  try {
    const result = await api('/libris/save', {
      method: 'POST',
      body: { articleId: article.value.id, connection: Number(connection.value), records: payload }
    })
    const savedIds = new Set([...result.created.map(c => c.libris), ...result.skipped])
    for (const r of chosen) {
      if (savedIds.has(String(r.libris))) {
        r._selected = false
        if (!r._warnings.includes('dupe')) r._warnings.push('dupe')
      }
    }
    const n = result.created.length
    say(`${n} verk ${n === 1 ? 'tillagt' : 'tillagda'} och kopplade till ${result.article}.` +
      (result.skipped.length ? ` ${result.skipped.length} fanns redan och hoppades över.` : ''))
  } catch (e) {
    failed(e, 'Inget sparades: ')
  } finally {
    busy.value = false
  }
}
</script>

<style lang="scss" scoped>
// Samma uttryck som resten av lexikonet: temats färger, tunna linjer och
// versaler i liten storlek för handlingar, som i menyn.
$ink: var(--sol-text, #333);
$muted: var(--sol-muted, #6b6b6b);
$accent: var(--sol-link, #45677a);
$paper: var(--sol-bg, #fff);
$warn: #8a3b2e;

.librisimport {
  font-size: 0.8rem;
  // Sajtens brödtextregler (indrag i följande stycken, smal spalt) gäller
  // inte i verktyget.
  p {
    text-indent: 0;
    max-width: none;
  }
}
.tool-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid $ink;
  margin-bottom: 1.5rem;
  h2 { margin-bottom: 0.4rem; }
}
.who {
  color: $muted;
  margin: 0;
}
h4 {
  margin-top: 0;
}
.hint {
  color: $muted;
  margin: 0.2rem 0 0.6rem;
}
.muted {
  color: $muted;
}
code {
  color: inherit;
  font-size: 0.95em;
}

// Fält och knappar
.input {
  font: inherit;
  color: $ink;
  border: 1px solid $ink;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.6);
  padding: 0.35em 0.5em;
  &:focus {
    outline: 2px solid $accent;
    outline-offset: 1px;
  }
  &:disabled {
    border-color: transparent;
    background: transparent;
    color: $muted;
  }
}
.wide {
  width: 100%;
  max-width: 26em;
}
.field {
  display: block;
  margin: 0.8rem 0;
  span {
    display: block;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $muted;
    margin-bottom: 0.2rem;
  }
}
.action, .link-action {
  font: inherit;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  &:disabled {
    cursor: default;
    opacity: 0.35;
  }
}
.action {
  color: $ink;
  background: transparent;
  border: 1px solid $ink;
  border-radius: 0;
  padding: 0.45em 1em;
  &:hover:not(:disabled) {
    background: $ink;
    color: $paper;
  }
  &.primary {
    background: $ink;
    color: $paper;
    &:hover:not(:disabled) {
      background: $accent;
      border-color: $accent;
    }
  }
}
.link-action {
  background: none;
  border: none;
  padding: 0;
  color: $accent;
  &:hover:not(:disabled) {
    text-decoration: underline;
  }
}
.flag {
  display: inline-block;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $muted;
  border: 1px solid currentColor;
  padding: 0 0.45em;
  margin: 0 0.4em 0.2em 0;
  &.f-year, &.f-lang, &.f-titledupe { color: $warn; }
  &.f-merged { color: $accent; }
}
.notice {
  border-left: 3px solid $accent;
  background: rgba(255, 255, 255, 0.55);
  padding: 0.5em 0.8em;
  margin: 1rem 0;
  &.error { border-color: $warn; }
}

// Inloggning
.login {
  max-width: 24em;
  .input { width: 100%; }
}

// Artikel och sökning
.setup {
  margin-bottom: 1rem;
}
.step {
  margin-bottom: 1rem;
}
.picker .hits {
  max-width: 26em;
  border: 1px solid $ink;
  border-top: none;
  background: rgba(255, 255, 255, 0.85);
  padding: 0.3em 0.6em;
  li { padding: 0.15em 0; }
}
.chosen {
  font-size: 1.1em;
  margin: 0.2rem 0;
  .link-action { margin-left: 0.6em; }
}
.search {
  display: flex;
  gap: 0.5em;
  max-width: 32em;
}
.options label {
  margin-right: 1.2em;
}

// Resultat
.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5em 1.2em;
  padding: 0.6em 0;
  background: $paper;
  border-bottom: 1px solid $ink;
  .count { color: $muted; }
  .primary { margin-left: auto; }
}
.records {
  margin: 0;
  li {
    display: grid;
    grid-template-columns: 1.6em 1fr auto;
    gap: 0.6em;
    align-items: start;
    padding: 0.6em 0.4em;
    border-bottom: 1px solid rgba(51, 51, 51, 0.15);
    &:hover { background: rgba(255, 255, 255, 0.5); }
    &.selected {
      background: rgba(255, 255, 255, 0.45);
      box-shadow: inset 3px 0 0 $accent;
    }
    &.existing { color: $muted; }
    input { margin-top: 0.3em; }
  }
  .entry { cursor: pointer; }
  .title { font-size: 1.15em; }
  .sub { color: $muted; }
  .meta { color: $muted; }
  .flags { margin-top: 0.3em; }
  .libris {
    color: $muted;
    font-size: 0.85em;
    font-variant-numeric: tabular-nums;
  }
}

// Detaljer och jämförelse
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4vh 2vw;
  background: rgba(51, 51, 51, 0.45);
}
.dialog {
  max-width: 96vw;
  max-height: 92vh;
  overflow: auto;
  background: $paper;
  border: 1px solid $ink;
  padding: 1rem 1.25rem;
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid $ink;
    margin-bottom: 0.8rem;
    h3 { font-size: 1.3em; }
  }
}
.columns {
  display: flex;
  gap: 1.5rem;
}
.column {
  table { border-collapse: collapse; }
  th {
    font-weight: normal;
    color: $muted;
    padding: 0.15em 0.8em 0.15em 0;
    white-space: nowrap;
    vertical-align: middle;
  }
  td { padding: 0.15em 0; }
  .input { width: 24em; }
  .reset { width: 1.5em; text-align: center; }
  tr.dirty .input { background: #fbeee9; border-color: $warn; }
  &.pickable {
    cursor: pointer;
    outline: 1px dashed $accent;
    outline-offset: 0.4rem;
    &:hover { background: rgba(255, 255, 255, 0.6); }
    // Avstängda fält sväljer klick; under valet går klicken till kolumnen.
    * { pointer-events: none; }
  }
}
.publishings {
  margin-top: 1rem;
  h4 { margin-top: 0; }
}
</style>
