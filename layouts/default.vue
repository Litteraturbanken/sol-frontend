<template>
    <div class="outer row justify-content-lg-center">


        <div class="col-xl-10 no-gutters">
            <header class="row">
                <div class="col-md-2 logo_container" @click="headerClick()">
                    <nuxt-link to="/">
                        <img class="logo" src="~/assets/sol_logo_dots.png" alt="Logotyp" />
                    </nuxt-link>
                </div>
                <div class="col-md-8">
                    <h1 class="" @click="headerClick()">
                        <nuxt-link to="/">Svenskt översättarlexikon</nuxt-link>
                    </h1>

                    <nav class="navbar navbar-expand-md">
                        <div class="navbar-nav">
                            <nuxt-link class="nav-item nav-link" to="/listor/artiklar"
                                >Översättare</nuxt-link
                            >
                            <nuxt-link class="nav-item nav-link" to="/listor/artiklar/tema"
                                >Tema</nuxt-link
                            >
                            <nuxt-link class="nav-item nav-link" to="/listor/priser"
                                >Priser</nuxt-link
                            >
                            <nuxt-link class="nav-item nav-link" to="/listor/kronologi"
                                >Kronologi</nuxt-link
                            >
                            <nuxt-link class="nav-item nav-link" to="/listor/sprak/original"
                                >Språk</nuxt-link
                            >
                            <a class="nav-item nav-link" href="https://litteraturbanken.se"
                                >Litteraturbanken</a
                            >
                            <a
                                class="nav-item nav-link"
                                href="https://www.facebook.com/SvensktOversattarlexikon"
                            >
                                <i class="icon icon-facebook-squared"></i>
                            </a>

                            <form
                                class=""
                                @submit.prevent="
                                    $router.push({ path: '/sok', query: { fras: searchstr } })
                                "
                            >
                                <autocomplete
                                    ref="autocomplete"
                                    :backend="autocompleteBackend"
                                    v-model="searchstr"
                                ></autocomplete>
                            </form>
                        </div>
                    </nav>
                </div>
            </header>
            <div class="mainview"><slot /></div>
        </div>
        <footer class="sc footer col-10 no-gutters justify-content-lg-center">
            <nav class="navbar navbar-expand-md">
                <div class="navbar-nav">
                    <nuxt-link class="nav-item nav-link" to="/om">Om lexikonet</nuxt-link>
                    <nuxt-link class="nav-item nav-link" to="/medarbetare">Medarbetare</nuxt-link>
                    <a class="nav-item nav-link" href="https://litteraturbanken.se/om/kontakt?sol"
                        >Kontakt</a
                    >
                </div>
            </nav>
        </footer>
    </div>
</template>

<script>


import Autocomplete from "~/components/autocomplete.vue"
import { debounce } from "~/assets/utils"
import backend from "~/assets/backend"
import _ from "lodash"


export default {
    components: { autocomplete: Autocomplete },
    setup() {
        const instance = getCurrentInstance()
        useHead(() => (function() {
        return {
            bodyAttrs: {}
        }

        }).call(instance.proxy))
        return {}
    },
    data() {
        return {
            showNav: false,
            searchstr: ""
        }
    },
    mounted: function() {
        window.addEventListener("keyup", this.onKeyup)

        // // TODO: remove hack when base url issue has been fixed
        // window.addEventListener("popstate", function(event) {
        //   console.log("back btn", event, window.location.href)
        //   window.location.reload()
        // })
    },
    beforeUnmount: function() {
        window.removeEventListener("keyup", this.onKeyup)
    },
    methods: {
        headerClick() {
            if (this.$route.path == "/") {
                window.location.reload()
            }
        },
        // TODO: to use the article search as a typeahead, partial string search must be implemented
        onKeyup(e) {
            if (["input", "textarea"].includes(e.target.nodeName.toLowerCase())) {
                return
            }
            if (e.keyCode == 83) {
                this.$refs.autocomplete.focus()
            }
        },
        autocompleteBackend: debounce(async function(str, signal) {
            if (!str) return []

            let { articles } = await backend.search(str, signal)

            if (articles) {
                return [
                    ..._.map(articles, item => {
                        return {
                            label: item.ArticleName,
                            url: "/artiklar/" + item.URLName
                        }
                    })
                ]
            }
        }, 150)
    }
}
</script>

<!-- <style reboot src="bootstrap/dist/css/bootstrap-reboot.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap-grid.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap.min.css"></style> -->

<style lang="scss"></style>
