const axios = require('axios')
const _ = require('lodash')
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
      { rel: 'icon', type: 'image/x-icon', href: 'http://www.oversattarlexikon.se/images/icons/favicon.png' }
    ]
  },

  css : [
    { src: '~assets/bootstrap_custom.scss', lang: 'scss' }
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
    //   if (ctx.isClient) {
    //     config.module.rules.push({
    //       enforce: 'pre',
    //       test: /\.(js|vue)$/,
    //       loader: 'eslint-loader',
    //       exclude: /(node_modules)/
    //     })
    //   }
    }
  },
  router: {
    linkActiveClass: 'router-link-active',
    // base: "/fklittb/sol/"
  },

  plugins : ["~plugins/filters.js"],

  generate: {
    minify : false,

    // interval : 100,
    routes: function () {
      let promises = []
      promises.push(
        axios.get(`http://demo.spraakdata.gu.se/fklittb/directus/api/1.1/tables/Articles/rows`, {
          auth: {
              username : "test-token",
          },
          params : {
            limit : 10000
          }
        }).then( ({data}) => {
          return data.data.map( (item) => {
            return {route : "/artiklar/" + decodeURIComponent(item.URLName), payload : item}
          })
        })
      )
      promises.push(
        axios.get(`http://demo.spraakdata.gu.se/fklittb/directus/api/1.1/tables/Works/rows`, {
          auth: {
              username : "test-token"
          },
          params : {
            limit : 200
          }
        }).then( ({data}) => {
          return data.data.map( (item) => {
            return {route : "/verk/" + item.WorkID, payload : item}
          })
        })
      )

    return Promise.all(promises).then(values => {
      return _.flatten(values)
    })

    }
  }
}
