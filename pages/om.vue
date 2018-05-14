<template>
    
    <section class="row">
        <div class="text col-md-8">
            <h2>Om Svenskt översättarlexikon</h2>
            <section v-html="PageContent"></section>
        </div>
        <div class="info col-md-4">
            <h3 class="red">Redaktör</h3>
            <ul>
                <li>Lars Kleberg<span class="fwn"> lars.kleberg[a]sh.se</span></li>
            </ul>

            <h3>Forskningsredaktör</h3>
            <ul>
                <li>Nils Håkanson<span class="fwn"> nils.hakanson[a]oversattarlexikon.se</span></li>
            </ul>
            <h3>Bibliografer</h3>
            <ul>
                <li>Cecilia Kugelberg</li>
                <li>Märta Bergstrand</li>
            </ul>

            <h3>Webbutvecklare</h3>
            <ul>
                <li>Johan Roxendal</li>
                <li>Martin Hammarstedt</li>
            </ul>

            <h3>Formgivning</h3>
            <ul>
                <li>Dick Claésson</li>
                <li>Johan Roxendal</li>
            </ul>

            <h3>Tidigare medarbetare</h3>
            <ul>
                <li>Mats Eriksson</li>
                <li>Magnus Sandgren</li>
            </ul>

            <h3>Utges av</h3>
            <ul>
                <li><a href="https://litteraturbanken.se">Litteraturbanken</a><span class="fwn"> 2018–</span></li>
                <li>Södertörns högskolebibliotek<span class="fwn"> 2009–2017</span></li>
            </ul>


        </div>
    </section>
</template>

<script>
    import backend from "assets/backend"

    export default {
        data() {
            return {
                PageContent: ""
            }
        },
        async asyncData() {
            let {PageContent} = await backend.getStatic("Om_Lexikonet")
            // PageContent = PageContent.replace(/<br \/>/g, "")
            return {PageContent}

        }
    }

</script>

<style lang="scss" scoped>
    
    .fwn {
        font-weight : normal;
    }
    .text {
        max-width : 33em;
        padding-right : 2em;
    }
    h2, .red {
        margin-top: 0;
    }
    ul > li {

    }
    .info {
        border-left: 1px solid grey;
        padding-left : 2em;
        li {
            font-size: 0.8em;
            font-weight : bold;
            .email {
                font-weight : normal;
            }
        }
    }
</style>

