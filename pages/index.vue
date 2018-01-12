<template>
  <div class="row">
      <div class="left-col col-md-6 ">
          <section class="section row no-gutters flex-column">
            
              <h2>
                <nuxt-link to="/om">Om Svenskt översättarlexikon</nuxt-link>
              </h2>
            
            <div class=" about" v-html="about"></div>
            <div class="read_more">
                <nuxt-link class="sc" to="/om">Läs mer <i class="arrow icon icon-play"></i></nuxt-link>
            </div>
          </section>
          <section class="section row no-gutters flex-column" v-if="themearticle2">
            
            <h2>
              <nuxt-link :to="'/artiklar/' + themearticle2.URLName">{{themearticle2.ArticleName}}</nuxt-link>
            </h2>
            
            <div class=" about" v-html="themearticle2.Ingress"></div>
            <div class="read_more">
                <nuxt-link class="sc" :to="'/artiklar/' + themearticle2.URLName">Läs mer <i class="arrow icon icon-play"></i></nuxt-link>
            </div>
          </section>
      </div>
      <div class="right-col col-md-6 ">
          <section class="section row no-gutters flex-column">
            <nuxt-link :to="'/artiklar/' + article.URLName">
              <figure class=""><img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + article.FileName" alt="">
              </figure>
            </nuxt-link>
            
              <h2><nuxt-link :to="'/artiklar/' + article.URLName">{{article.ArticleName}}, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</nuxt-link></h2>
            <div class=" about" v-html="article.Ingress"></div>
            <div class="read_more">
                <nuxt-link class="sc" :to="'/artiklar/' + article.URLName">Läs mer <i class="arrow icon icon-play"></i></nuxt-link>
            </div>
          </section>
          <section class="section row no-gutters flex-column" v-if="themearticle">
              <h2><nuxt-link :to="'/artiklar/' + themearticle.URLName">{{themearticle.ArticleName}}</nuxt-link>
              </h2>
            </nuxt-link>
            <div class=" about" v-html="themearticle.Ingress"></div>
            <div class="read_more">
                <nuxt-link class="sc" :to="'/artiklar/' + themearticle.URLName">Läs mer <i class="arrow icon icon-play"></i></nuxt-link>
            </div>
          </section>
      </div>
  </div>
</template>

<script>

import backend from "assets/backend"

export default {
  head: {
    bodyAttrs: {
        class: 'page-start'
    },
    meta: [
      {
        hid: 'description', 
        name: 'description', 
        content: `
        I Svenskt översättarlexikon blir översättarna – de som har skapat halva den svenska nationallitteraturen – synliga med biografi, porträtt och verkförteckning. 
        Lexikonet utvidgas kontinuerligt med nya artiklar och är fortfarande under utveckling. I första omgången presenteras avlidna svenska och finlandssvenska översättare.
        `.trim() 
      },
    ]
  },
  data() {
    return {about : null, article : null, themearticle: null, themearticle2: null, latest : null}
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
    let themearticle2 = await backend.getRandom(4)
    let latest = await backend.getLatest()
    // console.log("article, themearticle, latest", article, themearticle, latest)
    // console.log("PageContent", PageContent)
    return {about : PageContent, article, themearticle, themearticle2, latest}
  }
}
</script>

<style lang="scss" scoped>
    h2 {
      margin-top: 0;
      margin-bottom : 0.7em;
    }
    section {
      max-width : 23em;
    }
    .section {
        padding-top: 2em;
        padding-bottom: 2em;
        // width : 85%;
        &:first-child {
            border-bottom: 1px solid #333;
            padding-top : 0;
            
        }
    }

    .about {
      p {
        margin-top: 0.7em;
      }
      h2 {
        margin-bottom: 0;
      }
    }

    .read_more {
      margin-top: 1em;
    }

    .left-col {
        padding-right : 2em;
        border-right: 1px solid #333;
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
      font-size: 0.8em;
      position: relative;
      top: -1px;
    }

    img {
      border: 1px solid #333;
    }


    @media only screen and (max-width: 576px) {
      img {
        max-width: calc(100% - 30px);
      }
      .left-col, .right-col {
        border : none;
      }
      .left-col {
        padding-right: 15px;
      }
      .right-col {
        padding-left: 15px;
      }
      
    }

</style>
