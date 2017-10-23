<template>
  <div class="row">
      <div class="left-col col-md-6 ">
          <section class="section row no-gutters flex-column">
            <h2>Om Svenskt översättarlexikon</h2>
            <div class=" about" v-html="about"></div>
            <div class="read_more">
                <nuxt-link class="sc" to="/om">Läs mer <i class="arrow fa fa-play"></i></nuxt-link>
            </div>
          </section>
          <section class="section row no-gutters">
            <h2>Senast publicerade artiklar</h2>
            <ul class="col-12">
                <li v-for="article in latest" class="row justify-content-between">
                    <nuxt-link class="col-8" :to="'/artiklar/' + article.URLName">{{article.ArticleName}}</nuxt-link>
                    <span class="col-4 date">{{formatDate(article.DatePublished)}}</span>
                </li>
            </ul>
          </section>
      </div>
      <div class="right-col col-md-6 ">
          <section class="section row no-gutters flex-column">
            <figure class="col-12"><img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + article.FileName" alt="">
            </figure>
            <h2>{{article.ArticleName}}, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</h2>
            <div class=" about" v-html="article.Ingress"></div>
            <div class="read_more">
                <nuxt-link class="sc" :to="'/artiklar/' + article.URLName">Läs mer <i class="arrow fa fa-play"></i></nuxt-link>
            </div>
          </section>
          <section class="section row no-gutters flex-column" v-if="themearticle">
            <h2>{{themearticle.ArticleName}}</h2>
            <div class=" about" v-html="themearticle.Ingress"></div>
            <div class="read_more">
                <nuxt-link class="sc" :to="'/artiklar/' + themearticle.URLName">Läs mer <i class="arrow fa fa-play"></i></nuxt-link>
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
        let m = d.getMonth()
        if(m.toString().length == 1) {
          m = "0" + m
        }
        let day = d.getMonth()
        if(day.toString().length == 1) {
          day = "0" + day
        }
        return `${d.getFullYear()}-${m}-${day}`
    }
  },

  async asyncData() {

    let {PageContent} = await backend.getStatic('Om_Lexikonet_Ingress')
    // TODO parallelize
    let article = await backend.getRandom(1)
    let themearticle = await backend.getRandom(4)
    let latest = await backend.getLatest()
    console.log("article, themearticle, latest", article, themearticle, latest)
    console.log("PageContent", PageContent)
    return {about : PageContent, article, themearticle, latest}
  }
}
</script>

<style lang="scss" scoped>
    h2 {
      margin-top: 0;
      margin-bottom : 0.7em;
    }
    .section {
        padding-top: 2em;
        padding-bottom: 2em;
        // width : 85%;
        &:first-child {
            border-bottom: 1px solid #666;
            padding-top : 0;
            
        }
    }

    .read_more {
      margin-top: 1em;
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
    .arrow {
      margin-left: 7px;
      color : grey;
      font-size: 0.8em;
      position: relative;
      top: -1px;
    }
</style>
