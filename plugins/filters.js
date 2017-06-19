import Vue from "vue"

Vue.filter('json', function (value) {
  return JSON.stringify(value, null, 2)
})
