<template>
  <div class="map-toolbar">
    <q-btn-group flat rounded dense>
      <q-btn
        flat
        icon="add_location"
        label="添加禁飞区"
        dense
        :color="editMode === 'nofly-zone' ? 'primary' : ''"
        :disable="noFlyZoneCount >= 10"
        @click="$emit('add-nofly-zone')"
      >
        <q-tooltip>点击地图添加禁飞区 ({{ noFlyZoneCount }}/10)</q-tooltip>
      </q-btn>

      <q-btn
        flat
        icon="place"
        label="添加必经点"
        dense
        :color="editMode === 'waypoint' ? 'primary' : ''"
        :disable="waypointCount >= 20"
        @click="$emit('add-waypoint')"
      >
        <q-tooltip>点击地图添加必经点 ({{ waypointCount }}/20)</q-tooltip>
      </q-btn>

      <q-btn
        flat
        icon="flag"
        label="编辑起点"
        dense
        :color="editMode === 'start' ? 'primary' : ''"
        @click="$emit('edit-start')"
      >
        <q-tooltip>点击地图设置起点</q-tooltip>
      </q-btn>

      <q-btn
        flat
        icon="outlined_flag"
        label="编辑终点"
        dense
        :color="editMode === 'end' ? 'primary' : ''"
        @click="$emit('edit-end')"
      >
        <q-tooltip>点击地图设置终点</q-tooltip>
      </q-btn>
    </q-btn-group>

    <div class="toolbar-actions">
      <q-btn
        v-if="editMode"
        flat
        icon="close"
        label="取消"
        color="negative"
        dense
        @click="$emit('cancel-edit')"
      />

      <q-btn
        flat
        icon="route"
        label="生成航迹"
        color="primary"
        dense
        @click="$emit('generate-route')"
      >
        <q-tooltip>根据当前参数生成无人机航迹</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapToolbar',
  props: {
    editMode: String,
    noFlyZoneCount: { type: Number, default: 0 },
    waypointCount: { type: Number, default: 0 }
  },
  emits: ['add-nofly-zone', 'add-waypoint', 'edit-start', 'edit-end', 'generate-route', 'cancel-edit']
}
</script>

<style scoped lang="scss">
.map-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.78);
  border-radius: 14px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(14px);
  color: #e2e8f0;
  z-index: 1000;
}

.map-toolbar :deep(.q-btn),
.map-toolbar :deep(.q-btn__content) {
  color: #e2e8f0;
}

.map-toolbar :deep(.q-btn--flat.q-btn--dense) {
  padding: 4px 10px;
  min-height: 32px;
}

.map-toolbar :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  gap: 6px;
}

.map-toolbar :deep(.q-btn-group > .q-btn) {
  border-radius: 12px !important;
  background: rgba(30, 41, 59, 0.6);
}

.map-toolbar :deep(.q-btn-group > .q-btn--flat.q-btn--active) {
  background: rgba(59, 130, 246, 0.2);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.toolbar-actions :deep(.q-btn) {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  box-shadow: none;
}
</style>

