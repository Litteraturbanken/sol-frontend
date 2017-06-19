let langs = [
['Engelska','eng'],
['Arabiska',null],
['Nederländska',null],
['Norska (Bokmål)',null],
['Danska',null],
['Finska',null],
['Franska',null],
['Grekiska',null],
['Italienska',null],
['Latin','lat'],
['Norska (Nynorsk)',null],
['Portugisiska',null],
['Ryska','rus'],
['Spanska','spa'],
['Svenska','swe'],
['Tyska','ger'],
['Japanska',null],
['Kinesiska',null],
['Grekiska (klassisk)',null],
['Norska',null],
['Serbokroatiska',null],
['Flera språk','mul'],
['Polska',null],
['Slovenska',null],
['Isländska',null],
['Tjeckiska',null],
['Bulgariska',null],
['Ungerska',null],
['Provensalska',null],
['Lettiska',null],
['Litauiska',null],
['Kroatiska',null],
['Serbiska',null],
['Ukrainska',null],
['Slovakiska',null],
['Vietnamesiska',null],
['Turkiska',null],
['Rumänska',null],
['Hebreiska',null],
['Persiska',null],
['Keltiska',null],
['Bengali',null],
['Gujarati',null],
['Sanskrit','san'],
['Maithili','mai'],
['Indonesiska','ind'],
['Avariska','ava'],
['Rätoromanska','roh'],
['Tibetanska','tib'],
['Bosniska','Bos'],
['Fornegyptiska','egy'],
['Katalanska','cat'],
['Jiddisch','yid'],
['Estniska','est'],
['Armeniska','arm'],
['Semitiska språk','sem'],
['Baskiska','baq'],
['Koreanska','kor'],
['Tamil','tam'],
['Pali','pli'],
['Swahili','swa'],
['Medellågtyska','gmh'],
['Akkadiska','akk'],
['Vitryska','Bel'],
['Makedonska','mac'],
[' Fornisländska','non'],
['Sami','smi'],
['Kurdiska','kur'],
['Färöiska','fao'],
['Grönländska','esk'],
['Gotiska','got'],
['Fornsvenska','non'],
['Mordvinska','fiu'],
['Tjeremissiska (Mari)','fiu'],
['Urdu','urd'],
['Hindi','hin'],
['Panjabi','pan'],
['Kashmiri','kas'],
['Sindhi','snd'],
['Marathi','mar'],
['Kannada','kan'],
['Malayalam','mal'],
['Assamese','asm'],
['Afrikaans','afr'],
['Slaviska','sla'],
['Romani','rom']]

export function getLang (langid) {
    return langs[langid - 1][0]
}
