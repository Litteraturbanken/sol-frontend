const axios = require('axios')
module.exports = {


  /*
  ** Headers of the page
  */
  head: {
    title: 'starter',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
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
    linkActiveClass: 'router-link-active'
  },

  generate: {
    // routeParams : {
    //   '/artiklar/:id': [

    //   ]
    // }    


    interval : 100,
    routes: function () {
      return ["/artiklar/Herman_Napoleon_Almkvist"]
      return axios.get('https://ws.spraakbanken.gu.se/ws/karplabb/minientry?q=extended%7C%7Cand%7Cartikelid%7Cexists&resource=sol-articles&mode=sol&size=10000&show=url_name')
            .then( (resp) => {
              return resp.data.hits.hits.map((item) => {
                return "/artiklar/" + decodeURIComponent(item._source.Metadata.URLName)
              })
            }, (err) => {
              console.log("error", err)
            })

    }
  }
}
