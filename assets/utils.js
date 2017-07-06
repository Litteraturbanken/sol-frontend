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
