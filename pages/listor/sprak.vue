<template>

  <section class="">
    <h1>Språk</h1>
    <ul>
        <li v-for="(items, lang) in groups">
            <h2>{{lang}}</h2>
            <ul>
                <li v-for="item in items">{{item}}</li>
            </ul>
        </li>
    </ul>
  </section>
</template>

<style lang="scss">
  h2 {
    text-transform: capitalize;
  }
</style>

<script>
import axios from "axios"
import backend from "assets/model"
var c = console



export default {
    name : "Languages",
    head : {
      title : "Språk"
    },
    async asyncData ({error, env}) {
      try {
        return {groups : await backend.getLangs()} 
      } catch(err) {
        console.log("err", err)
        error("Ett fel uppstod, vänligen försök igen senare.")
        return {groups : null}
      }
    },
}

</script>

