
import _ from "lodash";



function urljoin(...urls) {
  return "/" + urls.map(item => _.trim(item, "/")).join("/");
}
async function getJSON(url, config = {}) {
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`API returned ${response.status}: ${url}`);
  return response.json();
}

/**
 * Lexikonets data kommer från appens egna serverrutter i server/api/sol,
 * som läser Directus och OpenSearch. Svaren har samma form som det gamla
 * Python-API:t gav, så sidorna nedan är oförändrade.
 *
 * apiBase är normalt en relativ sökväg. Då används $fetch, som under
 * serverrenderingen anropar rutten direkt utan att gå ut på nätverket.
 * Pekar apiBase på en annan värd görs ett vanligt HTTP-anrop.
 */
async function apiGet(endpoint, params = {}, config = {}) {
  const base = useRuntimeConfig().public.apiBase;
  const query = {};
  for (const [key, value] of Object.entries(params)) {
    if (value != null) query[key] = value;
  }
  if (/^https?:\/\//.test(base)) {
    const url = new URL(base + endpoint);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    return getJSON(url, config);
  }
  return $fetch(endpoint, { baseURL: base, query, signal: config.signal });
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
      var data = await getJSON(
        "https://litteraturbanken.se/api/autocomplete/" + encodeURIComponent(str)
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
    let resp = await apiGet(
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
      await apiGet("/articles", {
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
      await apiGet("/contributors", { show: "URLName,FirstName,LastName" })
    ).data;
  }
  async getContributor(name) {
    console.log("getContributor", encodeURIComponent(name.replace(/\s/g, "_")));
    return (
      await apiGet(
        "/contributor/" + encodeURIComponent(name.replace(/\s/g, "_")),
        // return (await apiGet("/contributor/" + encodeURIComponent(name),
        { show: "ArticleName,Articles.URLName:URLName" }
      )
    ).data;
  }

  async getRandom(type) {
    try {
      return (
        await apiGet("/articles/random/" + type, {
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
        await apiGet("/articles/latest", {
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
    let { work, articles } = await apiGet("/bibliography/" + workid);
    // let article = articles.length ? articles[0] : null
    this.fixWork(work[0]);
    return { work: work[0], articles };
  }

  async getWorksByAuthorName(authorname) {
    let { data } = await apiGet("/author/" + encodeURIComponent(authorname));
    // console.log("works", data)
    for (let work of data) {
      this.fixWork(work);
    }
    return data;
  }

  async getWorksByAuthor(urlname, sortVal) {
    let { languages, works, article, bibliography_types } = await apiGet(
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
      await apiGet("/languages/" + path, {
        show: "TranslatorYearBirth,TranslatorYearDeath,URLName,ArticleName"
      })
    ).data;
    // console.log("langMap", langMap)

    data[groupName] = _.omit(data[groupName], "Flera språk");
    return data;
  }
  async listPrizeArticles() {
    let data = (
      await apiGet("/articles/2", {
        show:
          "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
      })
    ).data;
    return data;
  }

  async listThemeArticles() {
    let data = (
      await apiGet("/articles/4", {
        show:
          "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
      })
    ).data;
    return data;
  }

  async search(str, signal) {
    return apiGet('/search/' + encodeURIComponent(str), {}, { signal });
  }

  async chronology(from, to) {
    let resultObj = await apiGet(`/chronology/${from}/${to}`, {
      show:
        "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
    });
    return resultObj;
  }

  async getStatic(page) {
    return (await apiGet("/static/" + page)).page;
  }
}

export default new PythonBackend();
// export default new DirectusBackend()
