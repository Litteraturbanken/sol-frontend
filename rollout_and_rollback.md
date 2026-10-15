# Produktionsrelease: Svenskt översättarlexikon på nya Directus

Plan för att flytta litteraturbanken.se/översättarlexikon och redaktörernas
admin till den nya plattformen, och för hur varje steg dras tillbaka.

Upprättad 2026-10-15. Ansvariga: Markus Rådberg (beslut, licens, DNS) och
Claude (övriga steg). Status förs i tabellen sist.

## Läget före releasen

| | Före | Efter |
|---|---|---|
| Publik sajt | Gamla Nuxt-appen på lb-appserv-a, via Apache, läser Python-API:t `litteraturbanken.se/sol/api` och databasen `sol` på lb-mysql | Nomad-jobbet `sol-frontend` (grenen `sol2`), läser Directus `filisol` och OpenSearch |
| Redaktörernas admin | `https://sol-admin.lb.se`: Directus 9.2.2 på lb-appserv-a (port 8056), databasen `sol` | `https://sol-admin.lb.se`: Directus 12.3.1, Nomad-jobbet `filisol`, databasen `filisol` i klustret |
| `filisol.pub.lb.se` | Adress till nya Directus | Tas bort |
| Bilder i artiklarna | `https://filisol.pub.lb.se/assets/<id>` (sol-frontend) | `https://sol-admin.lb.se/assets/<id>` |

Trafiken till både litteraturbanken.se och sol-admin.lb.se går i dag genom den
gamla lastbalanseraren (flytande IP 65.109.240.163, Caddy på lb-loadbalancer
med lb-loadbalancer-b som reserv). Klustrets publika ingress är 65.21.241.108.

## Förutsättningar (klara)

- Stopp för redigering i gamla Directus sedan 2026-10-15 kväll.
- Lexikonets innehåll överfört till `filisol` 2026-10-15 kl. 21.41 med
  `filisol/scripts/sync-sol-from-legacy.sh --apply`. Alla 31 tabeller
  stämde rad för rad (130 142 rader), två nya bildfiler uppladdade.
  Säkerhetskopia av `filisol` före överföringen:
  `~/lb/backups/filisol-before-sol-sync-20261015-214118.sql.gz`.
- Redaktörerna (lars.kleberg, mr.bergstrand, nils) har aktiva konton med
  redaktörsrollen i nya Directus. De måste logga in på nytt.
- Stage (`sol-stage.pub.lb.se`) kör samma kod som släpps:
  `b0c45ba`, bild `sha256:62c93826…f059`.

## Steg

### 1. Bildadressen i sol-frontend pekar på sol-admin.lb.se

`NUXT_PUBLIC_ASSETS_BASE=https://sol-admin.lb.se/assets/` i
`deploy/sol-frontend.nomad` och `deploy/sol-frontend-stage.nomad`, och som
standardvärde i `nuxt.config.js`. Gamla och nya Directus lämnar ut samma
fil-id:n, så adressen fungerar både före och efter steg 6.

Kontroll: en artikelbild på stage laddar från sol-admin.lb.se.
Tillbaka: sätt tillbaka `https://filisol.pub.lb.se/assets/` (före steg 6) och
kör om jobbet.

### 2. Directus-token för produktionsjobbet

Lägg till `nomad/jobs/sol-frontend/frontend/frontend` med
`directus_token: sol_frontend_directus_token` i
`lb-infra/config/nomad-secret-map.yaml` (samma läs-token som stage) och kör
`scripts/nomad_secrets.py validate` och `sync`.

Tillbaka: behövs inte; variabeln används bara av det nya jobbet.

### 3. Produktionsjobbet får den nya bilden

`deploy/sol-frontend.nomad` får stage-digesten och `git_ref`. Jobbet svarar
på `sol-frontend.pub.lb.se` och är ännu inte publikt under
litteraturbanken.se.

Kontroll: startsida, artikel, lista, sök, kronologi och en artikelbild på
`https://sol-frontend.pub.lb.se/översättarlexikon/`. Nomad-deploymenten
ska vara `successful`.
Tillbaka: `nomad job revert sol-frontend <föregående version>`.

Observera: jobbet får bara köra på de gamla baremetal-noderna
(`colocated|xl|nlp`), eftersom OpenSearch bara nås därifrån. Vid
vSwitch-avbrottet 2026-10-01 föll just de noderna, och stage låg nere.

### 4. Tema

Det tema som är sparat i Directus (`Meta`) gäller från första sidvisningen.
Vid planens upprättande: **Sand**. Byt i admin om sajten ska se ut som förut
(Vit).

### 5. Publik växling i den gamla lastbalanseraren

En regel i platsblocket för litteraturbanken.se skickar
`/översättarlexikon` och `/översättarlexikon/*` (även i kodad form
`/%C3%B6vers%C3%A4ttarlexikon…`) till klustrets ingress med värdnamnet
`sol-frontend.pub.lb.se`, på samma sätt som de befintliga reglerna för
stage-API:t.

Den körande Caddyfilen skiljer sig från `lb-infra`-repot (bl.a. SAOB:s
underhållsläge och en annan Elasticsearch-adress). **Kör därför inte
`ansible/legacy-loadbalancers.yml`**; det skulle skriva över de ändringarna.
I stället:

1. Kopia av den körande filen:
   `/etc/caddy/Caddyfile.before-sol-frontend-<tid>`.
2. Regeln läggs in före den sista `handle`, `caddy validate`, sedan
   `systemctl reload caddy` (ingen omstart, inga avbrutna anslutningar).
3. Samma ändring på reserven lb-loadbalancer-b, som inte får konfigurationen
   synkad (bara certifikaten).
4. Samma regel förs in i `lb-infra/ansible/roles/legacy-loadbalancer/files/Caddyfile`.

Kontroll: `https://litteraturbanken.se/översättarlexikon/` svarar från den
nya appen (`data-theme` i `<html>`), artikel, lista och sök fungerar, och
resten av litteraturbanken.se är opåverkad.
Tillbaka: kopiera tillbaka `Caddyfile.before-sol-frontend-<tid>` och
`systemctl reload caddy`. Gamla appen och Python-API:t är orörda och svarar
direkt igen. Den visar dock inte sådant som redigerats i nya Directus efter
steg 6.

### 6. Redaktörernas admin flyttar till sol-admin.lb.se

1. **Markus:** avaktivera licensen i nya Directus (visade sig onödigt: licensen för ideell förening gäller även efter adressbytet), på
   `https://filisol.pub.lb.se/admin/settings/license`. Licensen är bunden
   till `PUBLIC_URL` och måste avaktiveras under den gamla adressen först.
2. **Markus:** i Cloudflare, zonen lb.se: ändra `sol-admin.lb.se` (A, ej
   proxad) från 65.109.240.163 till 65.21.241.108.
3. **Claude:** `filisol/deploy/filisol.nomad`: `PUBLIC_URL` blir
   `https://sol-admin.lb.se`, `caddy-host` blir `sol-admin.lb.se`, och
   filisol-adresserna tas bort ur `CORS_ORIGIN` och `frame-src`. Kör
   jobbet och vänta tills ingressen har ett certifikat för sol-admin.lb.se.
4. **Markus:** aktivera licensen på
   `https://sol-admin.lb.se/admin/settings/license`.

Kontroll: inloggning på sol-admin.lb.se, en ändring sparas och syns på
sajten inom en minut, `/assets/<id>` svarar, licensen är aktiv,
`filisol.pub.lb.se` svarar inte längre.
Tillbaka: ta bort regeln `@sol_admin` i den gamla lastbalanserarens
Caddyfile (kopior `/etc/caddy/Caddyfile.before-sol-admin-20261015-225153` på
båda), peka DNS tillbaka på 65.109.240.163 (gamla Directus 9 svarar igen), sätt tillbaka `PUBLIC_URL` och `caddy-host` och kör
om jobbet, aktivera licensen under filisol.pub.lb.se. Det som redigerats i
nya Directus under tiden finns bara där.

Mellan steg 5 och 6 visar sol-admin.lb.se fortfarande gamla Directus.
Stoppet för redigering måste gälla tills steg 6 är klart.

### 7. Sökindexet

`littb-gather` (Nomad-tjänst i klustret, nattjobbet `littb-gather-nightly`
kl. 03.00) bygger indexet `littb-live_sol` i OpenSearch på lb-elastic-*.
Den läser artikellistan på sajten och hämtar varje artikel från
`litteraturbanken.se/sol/api/article/<namn>`.

Gjort 2026-10-15 23.06: den gamla lastbalanseraren skriver om
`litteraturbanken.se/sol/api/*` till sol-frontends
`/översättarlexikon/api/sol/*`, som ger samma svar ur nya Directus (bara
ordningen på verken inom en artikel skiljer). littb-gather behöver ingen
ändring. lb-infra `ecff5aa`; kopior
`/etc/caddy/Caddyfile.before-sol-api-20261015-230636` (lb-loadbalancer) och
`-230409`-filen på lb-loadbalancer-b.
Tillbaka: ta bort regeln `@sol_api` och ladda om; Python-API:t på
lb-appserv-a svarar då igen med gamla databasen.

Kvar: varje nattlig körning har avbrutits sedan 2026-09-21 med
`PopularityReportError: Raw popularity aggregation failed; indexing must
stop` (hämtningen av sidvisningar från Matomo). Tills det är löst byggs
inget index om, för någon av samlingarna.

### 8. Efter en vecka i drift

- Stäng gamla Directus 9 (lb-appserv-a, port 8056) och den gamla Nuxt-appen.
  Behåll databasen `sol` som arkiv.
- Stäng Python-API:t på lb-appserv-a; `/sol/api` besvaras redan av sol-frontend.
- Ta bort `sol-admin.lb.se` ur den gamla lastbalanserarens Caddyfile.
- Slå ihop `sol2` till `master` i sol-frontend.
- Stäng den publika rollens rätt att skapa och ändra filer i nya Directus.

## Status

| Steg | Status | Tid |
|---|---|---|
| 1. Bildadress | Klart: stage och produktion läser bilder från sol-admin.lb.se | 2026-10-15 22.30 |
| 2. Token för produktion | Klart: lb-infra `6194d6b`, 45 variabler synkade | 2026-10-15 22.33 |
| 3. Produktionsjobbet | Klart: version 6, två friska repliker (föregående: version 5) | 2026-10-15 22.36 |
| 4. Tema | Sand står kvar | |
| 5. Publik växling | Klart: lb-loadbalancer och lb-loadbalancer-b, kopior `/etc/caddy/Caddyfile.before-sol-frontend-20261015-223819` resp. `-224037`; lb-infra `8833ff8`. 21 av 21 e2e-prov mot den publika adressen | 2026-10-15 22.38 |
| 6. Admin till sol-admin.lb.se | Klart: DNS ändrad av Markus; filisol version 3 (föregående: 2), certifikat från Let's Encrypt, licensen aktiv utan omaktivering (ideell förening); filisol `a481863`. filisol.pub.lb.se svarar inte längre. 22.52: den gamla lastbalanseraren skickar också sol-admin.lb.se till nya Directus, för klienter med gammal DNS i cache (lb-infra `5a8726b`) | 2026-10-15 22.48 |
| 7. Sökindexet | Källan klar (`/sol/api` till nya Directus). Väntar på Matomo-felet | 2026-10-15 23.06 |
| 8. Städning | Om en vecka | |
