<template>
  <div ref="zone" style="width: 150px; height: 150px; position: relative;"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import nipplejs from 'nipplejs'

const emit = defineEmits(['move', 'end'])

const zone = ref(null)
let manager = null

onMounted(() => {
  manager = nipplejs.create({
    zone: zone.value,
    mode: 'static',
    position: {left: '50%', top: '50%'},
    size: 120,
    color: 'blue'
  })

  manager.on('move', (evt, data) => {
    emit('move', data)
  })

  manager.on('end', () => {
    emit('end')
  })
})

onBeforeUnmount(() => {
  if (manager) manager.destroy()
})
</script>
