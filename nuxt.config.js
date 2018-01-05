const axios = require('axios')
const _ = require('lodash')
const resolve = require('path').resolve

const isVueRule = (rule) => {
  return rule.test.toString() === '/\\.vue$/'
}
const isSASSRule = (rule) => {
  return ['/\\.sass$/', '/\\.scss$/'].indexOf(rule.test.toString()) !== -1
}
const sassResourcesLoader = {
  loader: 'sass-resources-loader',
  options: {
    resources: [
      resolve(__dirname, 'assets/_imports.scss')
    ]
  }
}

module.exports = {
  modules : [
    // '@nuxtjs/font-awesome'
  ],
  // mode : "spa",
  /*
  ** Headers of the page
  */
  head: {
    // titleTemplate: (titleChunk) => {
    //   console.log("titleChunk", titleChunk)
    //   // If undefined or blank then we don't need the hyphen
    //   return titleChunk ? `${titleChunk} - Svenskt översättarlexikon` : 'Svenskt översättarlexikon';
    // },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Svenskt översättarlexikon' },
      { name: 'google-site-verification', content: 'N0kL5tDA6UPMmyqv6bJBPNMsvOv27pcF7_ABjT94v5c' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: 'http://www.oversattarlexikon.se/images/icons/favicon.png' },
      // { href: '/bootstrap.css', rel: "stylesheet" },
      { rel: 'stylesheet', href: 'https://cloud.typography.com/7426274/6964792/css/fonts.css' },
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
  loading: { color: '#618296' },
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

      config.module.rules.forEach((rule) => {
        if (isVueRule(rule)) {
          rule.options.loaders.scss.push(sassResourcesLoader)
        }
        if (isSASSRule(rule)) {
          rule.use.push(sassResourcesLoader)
        }
      })
      
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
    // scrape: true,

    interval : 100,
    done ({ duration, errors, workerInfo }) {
      console.log("done", duration, errors, workerInfo)

      if (errors.length) {
      }
    },
    routes: async function () {
      // return ["/medarbetare/Barbro_Ek"]
      let routes = []
      let resp
      resp = await axios.get("https://litteraturbanken.se/sol/api/contributors?show=URLName,FirstName,LastName", {

      })
      for(let item of resp.data.data) {
        routes.push({route: "/medarbetare/" + item.URLName, payload: item})
      }
      
      // let routes = [
      //   "/listor/sprak/original",
      //   "/listor/sprak/till",
      //   "/listor/sprak/fran",
      // ]
      // let routes = []
      resp = await axios.get("https://litteraturbanken.se/sol/api/articles", {
        params : {
          show : "id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
        }
      })
      for(let item of resp.data.data) {
        routes.push({route : "/artiklar/" + decodeURIComponent(item.URLName), payload : item})
        routes.push({route : "/listor/avoversattare/" + decodeURIComponent(item.URLName)})
      }

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
