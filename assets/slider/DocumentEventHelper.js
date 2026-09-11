export default {
  mounted() {
    this.documentListeners = Object.entries(this.$options.events).map(([key, handler]) => {
      const listener = event => handler.call(this, event)
      document.addEventListener(key, listener)
      return [key, listener]
    })
  },
  beforeUnmount() {
    for (const [key, listener] of this.documentListeners || []) document.removeEventListener(key, listener)
  }
}
