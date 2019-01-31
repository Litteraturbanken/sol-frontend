/* eslint-disable */

export default ({ app }) => {
  app.router.afterEach((to, from) => {
    if(typeof window != 'undefined' && window.gtag) {
      console.log("pageview", to.fullPath)
      window.gtag('config', 'UA-132486790-2', { page_path: to.fullPath });
    }
  })
}