import axios from "axios";
import _ from "lodash";

const PYTHON_API = "https://litteraturbanken.se/sol/api";

function urljoin(...urls) {
  return "/" + urls.map(item => _.trim(item, "/")).join("/");
}
async function pythonGet(endpoint, params, config) {
  // console.log("PYTHON_API + endpoint", PYTHON_API + endpoint + "?" + _.toPairs(params).map(a => a.join("=")).join("&"))
  let { data } = await axios.get(PYTHON_API + endpoint, { ...config, params });
  return data;
}

function groupConnections(works, sortVal) {
  let connectionGroups = _.groupBy(works, "ConnectionType");
  return _(connectionGroups)
    .toPairs(connectionGroups)
    .map(([type, works]) => {
      return {
        type: Number(type),
        works: sortVal ? _.sortBy(works, sortVal) : works
      };
    })
    .sortBy(({ type }) => [2, 3, 1, 4, 5, 6, 7].indexOf(type))
    .value();
}
function groupBiblType(works) {
  works = _.filter(works, work => work.ConnectionType == "1");
  let connectionGroups = _.groupBy(works, "BibliographyType");
  return _(connectionGroups)
    .toPairs(connectionGroups)
    .map(([type, works]) => {
      return { type: Number(type), works };
    })
    .sortBy(({ type }) => [1, 5, 4, 6, 7, 8].indexOf(type))
    .value();
}

class PythonBackend {
  constructor() {
    this.articleTypes = {
      översättare: 1,
      översättarpris: 2,
      förlag: 3,
      temaartikel: 4,
      översättarorganisation: 5
    };
  }

  async autocomplete(str) {
    console.log("str", str);
    try {
      var { data } = await axios.get(
        "https://litteraturbanken.se/api/autocomplete/" + str
      );
    } catch (e) {
      console.error("Error in Littb autocomplete api:");
      console.error(e);
      return;
    }

    return _(data.data)
      .filter(item => ["etext", "faksimil", "author"].includes(item.doc_type))
      .map(item => {
        if (item.doc_type == "author") {
          return {
            label: item.name_for_index,
            url: "https://litteraturbanken.se/författare/" + item.authorid,
            type: "author"
          };
        } else {
          return {
            label: item.shorttitle,
            url: `https://litteraturbanken.se/författare/${item.authors[0].authorid}/titlar/${item.titleid}/sida/${item.startpagename}/${item.doc_type}`,
            type: "work"
          };
        }
      })
      .value();
  }

  async getArticle(articleId, showIngress) {
    let suffix = "";
    if (showIngress) {
      suffix = ",Ingress";
    }
    let resp = await pythonGet(
      urljoin("article", encodeURIComponent(articleId)),
      {
        show:
          "id,ArticleName,Status,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,ArticleText,ArticleTypes.ArticleTypeName,ArticleFiles.FileDescription" +
          suffix
      }
    );
    let { works, bibliography_types, ...rest } = resp;
    works = _.sortBy(works, "RealYear");
    // console.log("article", article)

    rest.article.ArticleText = rest.article.ArticleText.replace(
      /<p>\s*<img/g,
      "<p class='has_img'><img"
    );

    return {
      ...rest,
      works,
      connectionGroups: groupConnections(works),
      biblTypeGroups: groupBiblType(works),
      biblTypeData: _.groupBy(bibliography_types, "id")
    };
  }

  async listArticles() {
    let articles = (
      await pythonGet("/articles", {
        show:
          "id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
      })
    ).data;

    function normalizeSortLetter(letter) {
      return (
        {
          Ü: "U"
        }[letter.toUpperCase()] || letter.toUpperCase()
      );
    }

    // console.log("articles", articles, articles.length)
    let groups = _(articles)
      .groupBy(item => {
        return normalizeSortLetter(
          (item.TranslatorLastname || item.ArticleName)[0]
        );
      })
      .toPairs()
      .sortBy(([key, item]) => {
        return key;
      })
      .fromPairs()
      .value();
    for (let letter in groups) {
      groups[letter] = _.sortBy(
        groups[letter],
        item => item.TranslatorLastname || item.ArticleName
      );
    }
    return groups;
  }

  async getContributors() {
    return (
      await pythonGet("/contributors", { show: "URLName,FirstName,LastName" })
    ).data;
  }
  async getContributor(name) {
    console.log("getContributor", encodeURIComponent(name.replace(/\s/g, "_")));
    return (
      await pythonGet(
        "/contributor/" + encodeURIComponent(name.replace(/\s/g, "_")),
        // return (await pythonGet("/contributor/" + encodeURIComponent(name),
        { show: "ArticleName,Articles.URLName:URLName" }
      )
    ).data;
  }

  async getRandom(type) {
    try {
      return (
        await pythonGet("/articles/random/" + type, {
          show:
            "TranslatorYearBirth,TranslatorYearDeath,ArticleName,URLName,Ingress"
        })
      ).data[0];
    } catch (e) {
      console.log("error in random", e);
      throw e;
    }
  }

  async getLatest() {
    try {
      return (
        await pythonGet("/articles/latest", {
          show: "ArticleName,URLName,DatePublished"
        })
      ).data;
    } catch (e) {
      console.log("error in /latest", e);
    }
  }

  fixWork(work) {
    if (work.RemarkContent == "<p><br></p>") {
      work.RemarkContent = "";
    }
    if (work.Remark) {
      work.Remark = work.Remark.replace(
        "<br /><br /><p>&nbsp;</p><br /><br /><p>&nbsp;</p>",
        ""
      );
      work.Remark = work.Remark.replace("<br /><br /><p>&nbsp;</p>", "");
    }
    work.RemarkContent = work.RemarkContent || "";
  }

  async getWork(workid) {
    let { work, articles } = await pythonGet("/bibliography/" + workid);
    // let article = articles.length ? articles[0] : null
    this.fixWork(work[0]);
    return { work: work[0], articles };
  }

  async getWorksByAuthorName(authorname) {
    let { data } = await pythonGet("/author/" + encodeURIComponent(authorname));
    // console.log("works", data)
    for (let work of data) {
      this.fixWork(work);
    }
    return data;
  }

  async getWorksByAuthor(urlname, sortVal) {
    let { languages, works, article, bibliography_types } = await pythonGet(
      urljoin("/bibliography", encodeURIComponent(urlname))
    );
    // console.log("works", works)
    if (!works.length) {
      throw Error("No works found.");
    }
    for (let work of works) {
      work.RealYear = Number(work.RealYear);
      this.fixWork(work);
    }
    let original = _.filter(languages, "original");
    let source = _.filter(languages, "source");
    let target = _.filter(languages, "target");

    bibliography_types = _.map(bibliography_types, item => {
      item.id = String(item.id);
      return item;
    });
    let biblTypeData = _.groupBy(bibliography_types, "id");
    let biblTypeGroups = groupBiblType(works);
    // console.log('biblTypeGroups', biblTypeGroups)

    return {
      source,
      original,
      target,
      article,
      biblTypeGroups,
      biblTypeData,
      connectionGroups: groupConnections(works, sortVal)
    };
  }

  async getLangs(groupName, lang) {
    let path = _.compact([groupName, lang]).join("/");

    let data = (
      await pythonGet("/languages/" + path, {
        show: "TranslatorYearBirth,TranslatorYearDeath,URLName,ArticleName"
      })
    ).data;
    // console.log("langMap", langMap)

    data[groupName] = _.omit(data[groupName], "Flera språk");
    return data;
  }
  async listPrizeArticles() {
    let data = (
      await pythonGet("/articles/2", {
        show:
          "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
      })
    ).data;
    return data;
  }

  async listThemeArticles() {
    let data = (
      await pythonGet("/articles/4", {
        show:
          "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
      })
    ).data;
    return data;
  }

  async search(str) {
    if (this.cancel) this.cancel();

    let CancelToken = axios.CancelToken;

    try {
      var data = await pythonGet(
        "/search/" + str,
        {},
        // {show: "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        {
          cancelToken: new CancelToken(c => {
            // An executor function receives a cancel function as a parameter
            this.cancel = c;
          })
        }
      );
    } catch (e) {
      if (e.__CANCEL__) {
        return { articles: [], suggestion: null, works: null };
      } else {
        throw e;
      }
    }

    return data;
  }

  async chronology(from, to) {
    let resultObj = await pythonGet(`/chronology/${from}/${to}`, {
      show:
        "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
    });
    return resultObj;
  }

  async getStatic(page) {
    return (await pythonGet("/static/" + page)).page;
  }
}

export default new PythonBackend();
// export default new DirectusBackend()
