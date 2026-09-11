function renderUnsupported(el, { value }) {
    const text = String(value ?? '')
    const chars = 'ḌḍḤḥṢṣṬṭẒẓḪ̣ΑαΒβΓγΔδΕεΖζΗηΘθϑΙιΚκΛλΜμΝνΞξΟοΠπΡρΣσςΤτΥυΦφΧχΨψΩω'
    el.textContent = ' ' + text
    el.classList.toggle('unsupported-chars', [...text].some(char => chars.includes(char)))
}
export default defineNuxtPlugin(({ vueApp }) => {
    vueApp.directive('unsupported-chars', { mounted: renderUnsupported, updated: renderUnsupported })
    vueApp.directive('focus', { mounted: el => el.focus() })
})
