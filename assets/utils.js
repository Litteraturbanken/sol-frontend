import nSorter from "natural-sort"
import * as _ from "lodash"

export function debounce(func, wait, immediate) {
    var timeout
    return function() {

        let context = this
        let args = arguments

        return new Promise(function(resolve) {
            var later = function() {
                timeout = null
                if (!immediate) resolve(func.apply(context, args))
            }

            var callNow = immediate && !timeout
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)

            if (callNow) resolve(func.apply(context, args))
        })
    }
}

export function naturalSort(array, sortKey) {
    // sorts array in place
    let sorter = nSorter()
    let transposer = (char) => {
        let trans = _.fromPairs(
            _.zip(
                "ÁÂÃÄÅÇČÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöøùúûüýÿŠščā".split(""),
                "AAAÅÄCCEEEEIIIINOOOOOOUUUUYaaaaåäceeeeiiiinoooooouuuuyySsca".split("")
            )
        )
        trans = _.extend(
            trans,
            _.fromPairs(
                _.zip(
                    ["Æ", "æ", "Ð", "ð", "Þ", "þ", "ß", "Œ", "œ"],
                    ["AE", "ae", "DH", "dh", "TH", "th", "ss", "OE", "oe"]
                )
            )
        )

        return trans[char] || char
    }
    function stripChars(str) {
        return str.replace(/["'-–.…]/g, "").replace(/^\w*/, "")
    }
    array.sort((a, b) => {
        a = a[sortKey]
        b = b[sortKey]
        if(typeof a == "string") {
            a = _.map(stripChars(a), transposer).join("")
        }
        if(typeof b == "string") {
            b = _.map(stripChars(b), transposer).join("")
        }
        return sorter(a, b)
    })
}