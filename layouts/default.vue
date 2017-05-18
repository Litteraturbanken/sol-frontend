<template>
  <div class="container justify-content-center">
    <header class="row">
      <h1 class="col-12"><a href="/">Svenskt översättarlexikon</a></h1>

      <nav class="navbar navbar-toggleable-md navbar col-12">
          <div class="navbar-nav">

            <nuxt-link class="nav-item nav-link" to="/listor/artiklar">Översättare A-Ö</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/artiklar/tema">Temaartiklar</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/priser">Översättarpriser</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/kronologi">Kronologi</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/sprak">Språk</nuxt-link>

          </div>
      </nav>
    </header>
    <nuxt class="mainview row col-12"/>
  </div>

</template>

<script>
  export default {
    data () {
      return {
        showNav : false
      }
    }
  }
</script>


<!-- <style reboot src="bootstrap/dist/css/bootstrap-reboot.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap-grid.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap.min.css"></style> -->

<style lang="scss">
  @import "node_modules/bootstrap/scss/variables";
  @import "node_modules/bootstrap/scss/mixins";
  @import "node_modules/bootstrap/scss/custom";
  @import "node_modules/bootstrap/scss/reboot";
  @import "node_modules/bootstrap/scss/tables";
  @import "node_modules/bootstrap/scss/buttons";

  @import "node_modules/bootstrap/scss/nav";
  @import "node_modules/bootstrap/scss/navbar";
  @import "node_modules/bootstrap/scss/grid";

  @import "node_modules/bootstrap/scss/utilities";

  @import "node_modules/bootstrap/scss/responsive-embed";

  .navbar {
    .nav-link:first-child {
      padding-left : 0;
    }
  }
</style>

<style lang="scss">
html {
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  padding : 1em;
}

body {
  font-family : Georgia, serif;
}

.outer-container {
  display : flex;
  flex-direction : column;
  align-items: center;
  justify-content: center;

  & > * {
    width : 700px;
  }
}

.mainview {
}
a {
  color : #333;
  &:hover {
    color : grey;
  }
}
p {
  max-width : 40em;
  line-height: 143%;
}
p + p {
  margin-top : 1em;
}
li {
  list-style : none;
}
header {
  margin-bottom: 3em;
}
*, *:before, *:after
{
  box-sizing: border-box;
  margin: 0;
}
.mainmenu {
  margin-left : 0;
  padding-left : 0;
  li {
    display : inline-block;
    margin-right: 1em;
    &:first-child {
    }
    .router-link-exact-active {
      color : darkgrey;
    }
  }
}

blockquote {
  margin: 0 3em 1em 3em;
}
</style>
