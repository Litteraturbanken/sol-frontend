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
        return {
            "Ä": "Å", "Å" : "Ä", "ä" : "å", å: "ä", 
            "Č": "C", "Š": "S", "č": "c"
        }[char] || char
    }
      
    array.sort((a, b) => {
        a = a[sortKey]
        b = b[sortKey]
        if(typeof a == "string") {
            a = _.map(a, transposer).join("")
        }
        if(typeof b == "string") {
            b = _.map(b, transposer).join("")
        }
        return sorter(a, b)
    })
}