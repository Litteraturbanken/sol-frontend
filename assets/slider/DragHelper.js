// @flow

import DocumentEventHelper from './DocumentEventHelper'
import { relativeMouseOffset } from './utils'

export default {
  mixins: [DocumentEventHelper],

  props: {
    targetSelectorFrom: String,
    targetSelectorTo: String,
    disabled: Boolean
  },

  data () {
    return {
      isDrag: false
    }
  },

  watch: {
    target: 'bindTarget'
  },

  mounted () {
    this.bindTarget()
  },

  events: {
    mousedown (event) {
      return this.dragStart(event, this.offsetByMouse)
    },

    mousemove (event) {
      return this.dragMove(event, this.offsetByMouse)
    },

    mouseup (event) {
      return this.dragEnd(event, this.offsetByMouse)
    },

    touchstart (event) {
      return this.dragStart(event, this.offsetByTouch)
    },

    touchmove (event) {
      return this.dragMove(event, this.offsetByTouch)
    },

    touchend (event) {
      return this.dragEnd(event, this.offsetByTouch)
    },

    touchcancel (event) {
      return this.dragEnd(event, this.offsetByTouch)
    }
  },

  methods: {
    bindTarget () {
      this.targetFrom = this.$el.querySelector(this.targetSelectorFrom)
      this.targetTo = this.$el.querySelector(this.targetSelectorTo)
    },

    offsetByMouse (event) {
      return relativeMouseOffset(event, this.$el)
    },

    offsetByTouch (event) {
      const touch = event.touches.length === 0 ? event.changedTouches[0] : event.touches[0]
      return relativeMouseOffset(touch, this.$el)
    },

    dragStart (event, f) {
      if (this.disabled || ![this.targetFrom, this.targetTo].includes(event.target)) return
      event.preventDefault()
      this.isDrag = event.target
      this.$emit('dragstart', event, f(event), event.target === this.targetFrom ? "from" : "to")
    },

    dragMove (event, f) {
      if (!this.isDrag) return
      event.preventDefault()
      this.$emit('drag', event, f(event), this.isDrag === this.targetFrom ? "from" : "to")
    },

    dragEnd (event, f) {
      if (!this.isDrag) return
      event.preventDefault()
      this.$emit('dragend', event, f(event), this.isDrag === this.targetFrom ? "from" : "to")
      this.isDrag = null
    }
  },

  render () {
    return this.$slots.default && this.$slots.default[0]
  }
}
