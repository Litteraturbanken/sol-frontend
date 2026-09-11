# Frontend för Svenskt översättarlexikon

Frontend använder Nuxt 4 och Vue 3.

## Datakällor

Lexikonets innehåll ligger i Directus på `filisol.lb.se`, i samma instans som
FILIS men i egna collections. Fritextsökningen går mot OpenSearch-indexet
`littb-live_sol`, som byggs av littb-gather.

Appen har ett eget serverlager i `server/api/sol/`. Rutterna läser Directus
och OpenSearch och svarar i exakt samma form som det tidigare Python-API:t på
`litteraturbanken.se/sol/api`, som de ersätter. Därför är sidorna under
`pages/` oförändrade: `assets/backend.js` anropar `/api/sol` i stället, och
vid serverrendering går anropet rakt in i rutten utan att lämna processen.

Ett fåtal skillnader mot det gamla API:t är avsiktliga och beskrivs i
`server/api/sol/search/[phrase].get.js` och i `sortWorksByRealYear` i
`server/utils/sol.js`.

Åtkomsten i Directus är en egen API-användare med enbart läsrätt. Den skapas
och roteras om med:

```sh
DIRECTUS_URL=https://filisol.lb.se DIRECTUS_TOKEN=<admin> node scripts/directus-access.mjs
```

## Utveckling

Använd Node.js 24 (`nvm use`) och pnpm.

```sh
pnpm install --frozen-lockfile
cp .env.example .env   # fyll i NUXT_DIRECTUS_TOKEN
pnpm dev
```

Appen startar på port 3000. `SOL_HOST` styr utvecklingsserverns adress.
OpenSearch nås bara inifrån nätet, så lokalt behövs en tunnel:

```sh
ssh -f -N -L 9201:lb-loadbalancer:9200 vpn.lb.se
```

`NUXT_PUBLIC_API_BASE` kan peka på ett externt API i stället för de egna
rutterna, till exempel för att jämföra mot det gamla Python-API:t.

## Produktion

```sh
pnpm build
pnpm start
```

Nitro kör från `.output/server/index.mjs`. `HOST` och `PORT` styr serveradressen.
Sätt `NUXT_APP_BASE_URL` (eller `BASE_URL` vid build/dev) för installation under en sökväg.
Docker använder `/översättarlexikon/` (publik URL: `/%C3%B6vers%C3%A4ttarlexikon/`).
Bygget normaliserar sökvägen för Nitro och Vue Router. Använd Unicode i `NUXT_APP_BASE_URL` vid serverstart. Statiska filer ligger kvar i `static/`.

`pnpm generate` genererar statiska sidor i `.output/public` och hämtar dynamiska
artikel-, medarbetar- och verkadresser från API:t. Detta kräver API-åtkomst och kan ta tid.
En vanlig `pnpm build` behöver inte hämta lexikonets innehåll.

## Tester

```sh
pnpm exec playwright install chromium
pnpm lint
pnpm build
pnpm test
```

Playwright startar en lokal utvecklingsserver om ingen redan körs. Testerna läser
skarp data och kräver därför åtkomst till Directus. De kontrollerar SSR, hydrering, språkfilter,
bibliografier, artikelfilter och kronologins reglage. HTML-rapport och felspår sparas
lokalt i `playwright-report/` och `test-results/`.

```sh
# Testa en befintlig server, inklusive eventuell installationssökväg
PLAYWRIGHT_BASE_URL=http://localhost:3000/%C3%B6vers%C3%A4ttarlexikon/ pnpm test

# Testa Docker-bygget
pnpm test:docker
```

## Nomad

Den kanoniska jobbfilen är `deploy/sol-frontend.nomad`. Jobbet kör två AMD64-repliker
på skilda noder. En negativ affinity (-100) undviker `lb-nlp-c` när andra noder
kan ta lasten. Jobbet använder host networking, port 3035, Consul-hälsokontroller och automatisk
återställning vid en misslyckad rullande uppdatering. Den publika ingress-adressen är
`https://sol-frontend.pub.lb.se/översättarlexikon/`.

```sh
export NOMAD_ADDR=http://nomad.infra.lb.se
nomad job validate deploy/sol-frontend.nomad
nomad job plan deploy/sol-frontend.nomad
# Använd Job Modify Index från planen, eller 0 när jobbet är nytt.
nomad job run -detach -check-index=<index> deploy/sol-frontend.nomad
nomad job status sol-frontend
```

Bilden är låst till en registry-digest. Vid nästa release: bygg och publicera en ny
bild för `linux/amd64`, uppdatera bildens digest och `source_sha256` i jobbfilen,
och validera/planera innan registrering. Hälsokontrollen säger inget om Directus eller
OpenSearch; kontrollera därför även artikel- och sökfunktionerna efter varje
deployment. Directus-token läses ur Nomad Variables på
`nomad/jobs/sol-frontend/frontend/frontend`, item `directus_token`.
Jobbet ändrar inte den befintliga publika routningen på `litteraturbanken.se`.
