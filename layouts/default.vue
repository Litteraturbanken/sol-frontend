<template>
  <div class="outer-container">

    <header>
      <h1><a href="/">Svenskt översättarlexikon</a></h1>
      <ul class="mainmenu">
        <li><a href="/listor/artiklar">Översättare A-Ö</a></li>
        <li><a href="/listor/artiklar/tema">Temaartiklar</a></li>
        <li><a href="/listor/priser">Översättarpriser</a></li>
        <li><a href="/listor/kronologi">Kronologi</a></li>
        <li><a href="/listor/sprak">Språk</a></li>
      </ul>
    </header>
    <nuxt class="mainview"/>
  </div>
</template>

<style lang="scss">
html
{
  font-family: Georgia, serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  padding : 1em;
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
}
.mainmenu li {
  display : inline-block;
  margin-right: 1em;
  &:first-child {

  }
}

blockquote {
  margin: 0 3em 1em 3em;
}
</style>
