<template>
  <q-page class="terrain-page">
    <TerrainMap3D />
  </q-page>
</template>

<script setup>
import TerrainMap3D from 'components/TerrainMap3D.vue'
</script>

<style scoped>
.terrain-page {
  padding: 0;
  height: 100vh;
  overflow: hidden;
}
</style>
