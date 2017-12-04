const axios = require('axios')
const _ = require('lodash')

const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))

module.exports = {
  modules : [
    // '@nuxtjs/font-awesome'
  ],
  // mode : "spa",
  /*
  ** Headers of the page
  */
  head: {
    title: 'Svenskt översättarlexikon',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Svenskt översättarlexikon' },
      { name: 'google-site-verification', content: 'N0kL5tDA6UPMmyqv6bJBPNMsvOv27pcF7_ABjT94v5c' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: 'http://www.oversattarlexikon.se/images/icons/favicon.png' },
      // { href: '/bootstrap.css', rel: "stylesheet" },
      { rel: 'stylesheet', href: 'https://cloud.typography.com/7426274/770508/css/fonts.css' },
      // { rel: 'stylesheet', href: '/font/fa-custom.otf' }
      // <link rel="stylesheet" type="text/css" href="https://cloud.typography.com/7426274/770508/css/fonts.css" />
    ]
  },

  css : [
    { src: '~assets/fontawesome-custom/css/fa-custom.css', },
    { src: '~assets/fontawesome-custom/css/animation.css', },
    { src: '~assets/bootstrap_custom.scss', lang: 'scss' },
    { src: '~assets/styles.scss', lang: 'scss' },

    // 'bootstrap-vue/dist/bootstrap-vue.css'
  ],
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#0275d8' },
  // loading: false,
  /*
  ** Build configuration
  */
  build: {
      extractCSS: true,

    /*
    ** Run ESLINT on save
    */
    extend (config, ctx) {
      if (ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
      const path = require('path')
      config.resolve.symlinks = false
      // config.resolveLoader = { fallback: path.join(__dirname, "node_modules") }
    },
    vendor : [
      "axios"
    ]
  },
  router: {
    linkActiveClass: 'router-link-active',
    // base: "/fklittb/sol/"

    extendRoutes (routes, resolve) {
      routes.push({
        name: 'avoversattare-filter',
        path: '/listor/avoversattare/:id/:type?/:lang?',
        component: resolve(__dirname, 'pages/listor/avoversattare/_id.vue')
      })
    }
  },

  plugins : ["~plugins/filters.js"],


  generate: {
    minify : false,
    scrape: true,

    interval : 100,
    routes: async function () {
      /* eslint-disable */
      // return ["/medarbetare/Barbro_Ek"]
      return []
      let routes = []
      let resp = await axios.get("https://litteraturbanken.se/sol/api/contributors?show=URLName,FirstName,LastName", {

      })
      for(let item of resp.data.data) {
        routes.push({route: "/medarbetare/" + item.URLName})
      }
      return routes
      
      // let routes = [
      //   "/listor/sprak/original",
      //   "/listor/sprak/till",
      //   "/listor/sprak/fran",
      // ]
      // let routes = []
      // let resp = await axios.get("https://litteraturbanken.se/sol/api/articles", {
        // params : {
        //   show : "id,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,AuthorID,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname"
        // }
      // })
      for(let item of resp.data.data) {
        routes.push({route : "/artiklar/" + decodeURIComponent(item.URLName), payload : item})
        routes.push({route : "/listor/avoversattare/" + decodeURIComponent(item.URLName)})
      }

        // params : {
        //   show : "id,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,AuthorID,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname"
        // }
      let works = await axios.get('https://litteraturbanken.se/sol/api/bibliography/_all', {
      })

      for(let item of works.data.works) {
        routes.push({route : "/verk/" + item.id, payload : item})
      }

      // console.log("routes", routes)
      return routes



    }
  }
}
