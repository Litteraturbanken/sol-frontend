# Frontend för Svenskt översättarlexikon

Frontend använder Nuxt 4 och Vue 3. API-anrop använder native Fetch.

Två backends sköter datan: sol-admin (Directus) och SOL:s API-lager.
Projektet littb-gather flyttar datan från MySQL till OpenSearch för sökning i lb.se/bibliotek.

## Utveckling

Använd Node.js 24 (`nvm use`) och Yarn 1.

```sh
yarn install --frozen-lockfile
yarn dev
```

Appen startar på port 3000. `SOL_HOST` styr utvecklingsserverns adress.
`NUXT_PUBLIC_API_BASE` kan ersätta standard-API:t `https://litteraturbanken.se/sol/api`.

## Produktion

```sh
yarn build
yarn start
```

Nitro kör från `.output/server/index.mjs`. `HOST` och `PORT` styr serveradressen.
Sätt `NUXT_APP_BASE_URL` (eller `BASE_URL` vid build/dev) för installation under en sökväg.
Docker använder `/översättarlexikon/` (publik URL: `/%C3%B6vers%C3%A4ttarlexikon/`).
Bygget normaliserar sökvägen för Nitro och Vue Router. Använd Unicode i `NUXT_APP_BASE_URL` vid serverstart. Statiska filer ligger kvar i `static/`.

`yarn generate` genererar statiska sidor i `.output/public` och hämtar dynamiska
artikel-, medarbetar- och verkadresser från API:t. Detta kräver API-åtkomst och kan ta tid.
En vanlig `yarn build` behöver inte hämta lexikonets innehåll.

## Tester

```sh
npx playwright install chromium
yarn lint
yarn build
yarn test
```

Playwright startar en lokal utvecklingsserver om ingen redan körs. Testerna använder
publika API-data och kräver nätverksåtkomst. De kontrollerar SSR, hydrering, språkfilter,
bibliografier, artikelfilter och kronologins reglage. HTML-rapport och felspår sparas
lokalt i `playwright-report/` och `test-results/`.

```sh
# Testa en befintlig server, inklusive eventuell installationssökväg
PLAYWRIGHT_BASE_URL=http://localhost:3000/%C3%B6vers%C3%A4ttarlexikon/ yarn test

# Testa Docker-bygget
yarn test:docker
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
och validera/planera innan registrering. Hälsokontrollen är oberoende av det externa
API:t; kontrollera därför även artikel- och sökfunktionerna efter varje deployment.
Jobbet ändrar inte den befintliga publika routningen på `litteraturbanken.se`.
