import Vue from "vue"
import * as _ from "lodash"

Vue.filter('json', function (value) {
  return JSON.stringify(value, null, 2)
})



Vue.directive("unsupported-chars", (el, {value}) => {
    console.log("unsupported-chars value", value)
    const arabic = "ḌḍḤḥṢṣṬṭẒẓḪẒẓ̣"
    const greek = "ΑαΒβΓγΔδΕεΖζΗηΘθϑΙιΚκΛλΜμΝνΞξΟοΠπΡρΣσςΤτΥυΦφΧχΨψΩω"
    const chars = [...arabic, ...greek]
    if(_.intersection(value.split(""), chars).length) {
        el.innerHTML = " " + `<span class="unsupported-chars">${value}</span>`
    } else {
        el.innerText = " " + value
    }
})