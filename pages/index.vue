<template>
  <div class="row">
      <div class="left-col col-md-6 ">
          <section class="section row no-gutters">
            <h1>Om Svenskt översättarlexikon</h1>
            <div class=" about" v-html="about"></div>
            <div>
                <nuxt-link to="/om">Läs mer &gt;&gt;</nuxt-link>
            </div>
          </section>
          <section class="section row no-gutters">
            <h1>Senast publicerade</h1>
            <ul class="col-12">
                <li v-for="article in latest" class="row justify-content-between">
                    <nuxt-link class="col-8" :to="'/artiklar/' + article.URLName">{{article.ArticleName}}</nuxt-link>
                    <span class="col-4 date">{{formatDate(article.DatePublished)}}</span>
                </li>
            </ul>
          </section>
      </div>
      <div class="right-col col-md-6 ">
          <section class="section row no-gutters">
            <figure class="col-12"><img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + article.FileName" alt="">
            </figure>
            <h1>{{article.ArticleName}}, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</h1>
            <div class=" about" v-html="article.Ingress"></div>
            <div>
                <nuxt-link :to="'/artiklar/' + article.URLName">Läs mer &gt;&gt;</nuxt-link>
            </div>
          </section>
          <section class="section row no-gutters">
            <h1>{{themearticle.ArticleName}}</h1>
            <div class=" about" v-html="themearticle.Ingress"></div>
            <div>
                <nuxt-link :to="'/artiklar/' + themearticle.URLName">Läs mer &gt;&gt;</nuxt-link>
            </div>
          </section>
      </div>
  </div>
</template>

<script>

import backend from "assets/backend"

export default {
  data() {
    return {about : null, article : null, themearticle: null, latest : null}
  },

  methods : {
    formatDate(datestr) {
        let d = new Date(datestr)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }
  },

  async asyncData() {

    let {PageContent} = await backend.getStatic('Om_Lexikonet_Ingress')
    let article = await backend.getRandom(1)
    let themearticle = await backend.getRandom(4)
    let latest = await backend.getLatest()
    return {about : PageContent, article, themearticle, latest}
  }
}
</script>

<style lang="scss">
    .section {
        padding-top: 2em;
        padding-bottom: 2em;
        // width : 85%;
        &:first-child {
            border-bottom: 1px solid #666;
            padding-top : 0;
            
        }
        h1 {
            margin-bottom: 0.5em;
        }
    }

    .left-col {
        padding-right : 2em;
        border-right: 1px solid #666;
    }
    .right-col {
        // border-left: 1px solid lightgrey;
        padding-left : 2em;
    }

    .date {
        text-align: right;
    }
</style>
