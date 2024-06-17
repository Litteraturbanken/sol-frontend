# Frontend för Svenskt översättarlexikon

Frontend är skriven i Nuxt 2.x. 

Två backends sköter datan: ett Directusprojekt på lb-appserv-a (sol-admin) och ett API-lager för fulltextsökning i MySQL på appserv (/home/johan/sol/api/sol.py).

Projektet littb-gather flyttar datan från MySQL på lb-mysql till Opensearch, för att göra den sökbar i lb.se/bibliotek




## Build Setup

``` bash
# install dependencies
$ npm install # Or yarn install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm start


