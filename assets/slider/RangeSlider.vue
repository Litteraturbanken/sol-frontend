<template lang="html">
  <span class="range-slider">
    <drag-helper
      target-selector-from=".range-slider-knob-from"
      target-selector-to=".range-slider-knob-to"
      v-bind:disabled="disabled"
      @drag="drag"
      @dragend="dragEnd">
      <span ref="inner" class="range-slider-inner">
        <!-- <input class="range-slider-hidden" type="text" :name="name" :value="actualValue"> -->
        <span class="range-slider-rail"></span>
        <span class="range-slider-fill" :style="{ left: fromValuePercent + '%', width: (toValuePercent - fromValuePercent) + '%' }"></span>
        <span class="range-slider-knob-from" :style="{ left: fromValuePercent + '%' }"></span>
        <span class="range-slider-knob-to" :style="{ left: (toValuePercent) + '%' }"></span>
      </span>
    </drag-helper>
  </span>
</template>

<script>
// @flow

import DragHelper from './DragHelper'
import { round } from './utils'

export default {
  props: {
    name: String,
    value: Array,
    disabled: {
      type: Boolean,
      default: false
    },
    min: {
      type: [String, Number],
      default: 0
    },
    max: {
      type: [String, Number],
      default: 100
    },
    step: {
      type: [String, Number],
      default: 1
    }
  },

  data () {
    return {
      actualValueFrom : null,
      actualValueTo: null
    }
  },

  created () {
    const { _min: min, _max: max } = this
    // let defaultValue = Number(this.value)

    // if (this.value == null || isNaN(defaultValue)) {
    //   if (min > max) {
    //     defaultValue = min
    //   } else {
    //     defaultValue = (min + max) / 2
    //   }
    // }

    this.actualValueFrom = this.value[0]
    this.actualValueTo = this.value[1]
  },

  computed: {
    _min () {
      return Number(this.min)
    },

    _max () {
      return Number(this.max)
    },

    _step () {
      return Number(this.step)
    },

    fromValuePercent () {
      return (this.actualValueFrom - this._min) / (this._max - this._min) * 100
    },
    toValuePercent () {
      return (this.actualValueTo - this._min) / (this._max - this._min) * 100
    }
  },

  watch: {
    value (newValue) {
      // const value = Number(newValue)
      if (newValue != null && newValue.length === 2) {
        // this.actualValue = this.round(newValue)
        this.actualValueFrom = newValue[0]
        this.actualValueTo = newValue[1]
      }
    },
    // min () {
    //   this.actualValue = this.round(this.actualValue)
    // },
    // max () {
    //   this.actualValue = this.round(this.actualValue)
    // }
  },

  methods: {
    drag (event, offset, fromOrTo) {
      const { offsetWidth } = this.$refs.inner
      console.log("offsetWidth", offsetWidth)
      if(fromOrTo === 'from') {
        this.actualValueFrom = this.round(this.valueFromBounds(offset.left, offsetWidth))
      } else {
        this.actualValueTo = this.round(this.valueFromBounds(offset.left, offsetWidth))
      }

      this.emitEvent(false)
    },

    dragEnd (event, offset, fromOrTo) {
      const { offsetWidth } = this.$refs.inner
      if(fromOrTo === 'from') {
        this.actualValueFrom = this.round(this.valueFromBounds(offset.left, offsetWidth))
      } else {
        this.actualValueTo = this.round(this.valueFromBounds(offset.left, offsetWidth))
      }
      this.emitEvent(true)
    },

    emitEvent(isDragEnd) {
      this.$emit('input', [this.actualValueFrom, this.actualValueTo])
      if (isDragEnd) {
        this.$emit('change', [this.actualValueFrom, this.actualValueTo])
      }
    },

    valueFromBounds (point, width) {
      return (point / width) * (this._max - this._min) + this._min
    },

    round (value) {
      return round(value, this._min, this._max, this._step)
    }
  },

  components: {
    DragHelper
  }
}
</script>

<style lang="scss">
$slider-height: 20px !default;
$slider-width: 130px !default;
$rail-height: 4px !default;
$knob-size: 20px !default;

$rail-color: #e2e2e2 !default;
$rail-fill-color: #21fb92 !default;
$knob-color: #fff !default;

$knob-border: 1px solid #f5f5f5 !default;
$knob-shadow: 1px 1px rgba(0, 0, 0, 0.2) !default;

.range-slider {
  display: inline-block;
  padding: 0 ($knob-size / 2);
  height: $slider-height;
  // width: $slider-width;
}

.range-slider-inner {
  display: inline-block;
  position: relative;
  height: 100%;
  width: 100%;
}

.range-slider-rail,
.range-slider-fill {
  display: block;
  position: absolute;
  top: 50%;
  left: 0;
  height: $rail-height;
  border-radius: $rail-height / 2;
  transform: translateY(-50%);
}

.range-slider-rail {
  width: 100%;
  background-color: $rail-color;
}

.range-slider-fill {
  background-color: $rail-fill-color;
}

.range-slider-knob-from {
  display: block;
  position: absolute;
  top: 50%;
  left: 0;
  box-sizing: border-box;
  height: $knob-size;
  width: $knob-size;
  border: $knob-border;
  border-radius: 50%;
  background-color: $knob-color;
  box-shadow: $knob-shadow;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.range-slider-knob-to {
  display: block;
  position: absolute;
  top: 50%;
  left: 100%;
  box-sizing: border-box;
  height: $knob-size;
  width: $knob-size;
  border: $knob-border;
  border-radius: 50%;
  background-color: $knob-color;
  box-shadow: $knob-shadow;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.range-slider-hidden {
  display: none;
}
</style>
