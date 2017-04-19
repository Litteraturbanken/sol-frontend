<template>
  <div>

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
    <nuxt/>
  </div>
</template>

<style>
html
{
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  padding : 1em;
}
p {
  max-width : 40em;
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
.mainmenu li {
  display : inline-block;
  margin-right: 1em;
}
.button--green
{
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #3b8070;
  color: #3b8070;
  text-decoration: none;
  padding: 10px 30px;
}
.button--green:hover
{
  color: #fff;
  background-color: #3b8070;
}
.button--grey
{
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #35495e;
  color: #35495e;
  text-decoration: none;
  padding: 10px 30px;
  margin-left: 15px;
}
.button--grey:hover
{
  color: #fff;
  background-color: #35495e;
}
</style>
