/* eslint-disable */

export default ({ app }) => {
  app.router.afterEach((to, from) => {
    if(typeof window != 'undefined' && window.gtag) {
      window.gtag('config', 'UA-132486790-2', { page_path: "/översättarlexikon" + to.fullPath });
    }
  })
}