<template>
  <section class="">
  <h2>Kronologi {{sliderValue[0]}}–{{sliderValue[1]}}</h2>

  <div class="explain">
    <!-- <h3>Förklaring</h3> -->
     <p>Kronologin listar lexikonets översättare för en viss tidsperiod. Klicka och dra kontrollerna på tidsaxeln för att avgränsa tidsperioden.
       
       Kronologin baseras på utgivningsår för översättarnas verk, begränsat av deras levnadsperiod. Den ger därmed en approximativ bild av deras verksamhetsperiod.</p>
  </div>


  <div class="row no-gutters"><no-ssr>
      <range-slider
         class="slider col-12"
         :min="startYear"
         :max="endYear"
         step="1"
         v-model="sliderValue"
         @change="sliderChange">
       </range-slider>
    </no-ssr>
     </div>
     <div class="ticks row no-gutters justify-content-between" :style="offsetStyle(0, 0)">
       <span v-for="i in range" class="tick" >
         
       </span>
     </div>
     <div class="timeline row no-gutters justify-content-between" :style="offsetStyle(-20, -20)">
       <span v-for="i in range" class="">
         {{i}}&nbsp;
       </span>
     </div>
  
  
  <ul class="results resultlist" :class="{loading: loading}">
      <li v-for="article in articles">
          <a :href="'/artiklar/' + article.URLName">{{article.ArticleName}}<span v-if="article.TranslatorYearBirth || article.TranslatorYearDeath"> ({{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}})</span></a>
      </li>
  </ul>
  </section>
</template>

<script>
    import _ from "lodash"
    import backend from "assets/backend"

    import RangeSlider from '~/assets/slider/RangeSlider'
    // you probably need to import built-in style
    // import 'vue-range-slider/dist/vue-range-slider.css'



    export default {
        name : "Kronologi",
        head () {
            return {
                title : "Kronologi – Svenskt översättarlexikon"
            }
        },
        components: {
           RangeSlider,
         },
         methods : {
          sliderChange : async function([start, end]) {
            this.loading = true
            this.articles = await backend.chronology(start, end)
            this.loading = false
            // this.$route.hash = start
            window.location.hash = `${start}-${end}`
          },
          offsetStyle : function(leftOffset, rightOffset) {
            leftOffset = leftOffset || 0
            rightOffset = rightOffset || 0
            return {
              'margin-left' : `calc(${leftOffset}px + ${this.percentLeftPad}%)`,
              'margin-right' : `calc(${this.percentRightPad}% + ${rightOffset}px)`
            }
          }
        },
         computed : {
          range : function() {
            let years = _.range(this.startYear, this.endYear + 1).filter((item) => item % 100 == 0)

            let total = this.endYear - this.startYear
            let first = years[0]
            let last = _.last(years)
            this.percentLeftPad = ((first - this.startYear) / total * 100)
            this.percentRightPad = ((this.endYear - last) / total * 100)
            return years
          }
          
         },
         data () {
          return {
            loading : false,
            startYear : null,
            endYear : null,
            percentLeftPad : null,
            percentRightPad : null,
            sliderValue : [1900, 1950],
            articles : null
          }
         },
        created : function() {

          if(this.$route.hash) {
            this.sliderValue = this.$route.hash.replace("#", "").split("-").map(Number)
          } 

          // TODO: un-hardcode this
          this.startYear = 1437
          this.endYear = 2017

          this.sliderChange(this.sliderValue)
        },
        async asyncData ({ params, error, route }) {
          // console.log("route.hash", route.hash.replace("#", ""), route)
          
          // return {startYear, endYear}
        }
    }

</script>

<style lang="scss" scoped>
  h2 {
  }
  .slider {
    width : 100%;
  }
  .timeline {
    margin-right : 0.4em;
    span {
      // padding: 0 
    }
  }
  .ticks {
  }
  .ticks {
    // margin: 0 10px;
    .tick {
      display : block;
      width : 1px;
      height : 7px;
      border-left: 1px solid black;
    }
  }

  .results {
    
    columns : 300px 3;
    opacity : 1;
    transition: opacity 200ms;
    &.loading {
      transition: opacity 200ms;
      opacity : 0;
    }
    margin-top: 2em;
  }

</style>
