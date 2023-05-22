import nSorter from "natural-sort";
import * as _ from "lodash";

export function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    let context = this;
    let args = arguments;

    return new Promise(function(resolve) {
      var later = function() {
        timeout = null;
        if (!immediate) resolve(func.apply(context, args));
      };

      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) resolve(func.apply(context, args));
    });
  };
}

export function naturalSort(array, ...sortKeys) {
  // sorts array in place
  let sorter = nSorter();
  let transposer = char => {
    let trans = _.fromPairs(
      _.zip(
        "ÁÂÃÄÅÇČĆÈÉÊËĖÌÍÎÏÑÒÓÔÕØŌÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõøōùúûüýÿŠščāĐđěřŁŚ".split(
          ""
        ),
        "AAAÅÄCCCEEEEEIIIINOOOOÖOUUUUYaaaaåäceeeeiiiinooooöouuuuyySscaDderLS".split(
          ""
        )
      )
    );
    trans = _.extend(
      trans,
      _.fromPairs(
        _.zip(
          ["Æ", "æ", "Ð", "ð", "Þ", "þ", "ß", "Œ", "œ"],
          ["AE", "ae", "DH", "dh", "TH", "th", "ss", "OE", "oe"]
        )
      )
    );

    return trans[char] || char;
  };
  function stripChars(str) {
    return str.replace(/[ʿ"'\-\–\.…]/g, "").replace(/^ */, "");
  }
  function getSortKey(obj) {
    let output = null;
    for (let key of sortKeys) {
      output = output || obj[key];
    }
    return output;
  }
  array.sort((a, b) => {
    a = getSortKey(a);
    b = getSortKey(b);
    if (typeof a == "string") {
      a = _.map(stripChars(a), transposer).join("");
    }
    if (typeof b == "string") {
      b = _.map(stripChars(b), transposer).join("");
    }
    return sorter(a, b);
  });
}
