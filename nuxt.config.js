const axios = require('axios')
const _ = require('lodash')

const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))

module.exports = {


  /*
  ** Headers of the page
  */
  head: {
    title: 'Svenskt översättarlexikon',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Svenskt översättarlexikon' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: 'http://www.oversattarlexikon.se/images/icons/favicon.png' },
      { href: '/bootstrap.css', rel: "stylesheet" },
    ]
  },

  css : [
    // { src: '~assets/bootstrap_custom.scss', lang: 'scss' }
    'bootstrap-vue/dist/bootstrap-vue.css'
  ],
    
  
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Build configuration
  */
  build: {
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
    }
  },
  router: {
    linkActiveClass: 'router-link-active',
    // base: "/fklittb/sol/"

    extendRoutes (routes, resolve) {
      routes.push({
        name: 'custom',
        path: '/listor/avoversattare/:id/:type?/:lang?',
        component: resolve(__dirname, 'pages/listor/avoversattare/_id.vue')
      })
    }
  },

  plugins : ["~plugins/filters.js"],


  generate: {
    minify : false,

    // interval : 100,
    routes: async function () {
      // let routes = [
      //   "/listor/sprak/original",
      //   "/listor/sprak/till",
      //   "/listor/sprak/fran",
      // ]
      let routes = []
      let resp = await axios.get("http://litteraturbanken.se/sol/api/articles", {
        // params : {
        //   show : "ArticleID,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,AuthorID,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname"
        // }
      })
      for(let item of resp.data.data) {
        routes.push({route : "/artiklar/" + decodeURIComponent(item.URLName), payload : item})
        // routes.push({route : "/listor/avoversattare/" + decodeURIComponent(item.URLName)})
      }

        // params : {
        //   show : "ArticleID,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,AuthorID,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname"
        // }
      // let works = await axios.get("http://litteraturbanken.se/sol/api/bibliography/_all", {
      // })

      // for(let item of works.data.works) {
      //   routes.push({route : "/verk/" + item.WorkID, payload : item})
      // }

      return routes


      // let upperLimit = 10000
      // let chunkSize = 1000
      // let fetch = (n) => {
      //   return axios.get(`https://ws.spraakbanken.gu.se/ws/sol/api/1.1/tables/Works/rows`, {
      //     auth: {
      //         username : "test-token"
      //     },
      //     params : {
      //       // limit : 2000
      //       offset : n,
      //       limit : chunkSize,
      //     }
      //   }).then( ({data}) => {
      //     return data.data.map( (item) => {
      //       return {route : "/verk/" + item.WorkID, payload : item}
      //     })
      //   })
        
      // }
      // let n = 0
      // while(true) {
      //   if(n > upperLimit) break
      //   promises.push(_.partial(fetch, n))
      //   n += chunkSize
      // }

      // execute Promises in serial
      // return promiseSerial(promises).then(values => {
      //   return _.flatten(values)
      // })

    // return Promise.all(promises).then(values => {
    //   return _.flatten(values)
    // })

    }
  }
}
