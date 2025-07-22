<template>
  <q-card flat bordered class="tech-card text-primary q-pa-sm">
    <!-- 标题 -->
    <q-expansion-item
      v-model="expanded"
      icon="webhook"
      label="当前无人机"
      :caption="curDroneId"
      class="tech-expansion"
    >

      <!-- 列表内容 -->
      <q-scroll-area style="height: 200px;">
        <q-list separator>
          <q-item
            v-for="drone in droneList"
            :key="drone.id"
            class="drone-item tech-item"
            clickable
            dense
            @click="selectDrone(drone)"
          >

            <!-- 内容区域 -->
            <q-item-section>
              <q-item-label class="text-primary text-weight-bold tech-text">{{ drone.id }}</q-item-label>
              <q-item-label caption class="text-accent tech-text-secondary">{{ drone.ip }}:{{ drone.port }}</q-item-label>

              <!-- 电池电量条 -->
              <q-item-label class="text-subtitle2 text-blue-grey-3 tech-text">🔋 {{ drone.battery }}%</q-item-label>
              <q-linear-progress
                :value="drone.battery / 100"
                :color="batteryColor(drone.battery)"
                size="md"
                rounded
                track-color="grey-9"
                class="q-mt-xs tech-progress"
              />
            </q-item-section>
          </q-item>

        </q-list>
      </q-scroll-area>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import {ref} from "vue";

let expanded = ref(false);

const droneList = [
  {id: 'DJI-001', ip: '192.168.1.10', port: 8888, battery: 76},
  {id: 'DJI-002', ip: '192.168.1.11', port: 8890, battery: 42},
  {id: 'DJI-003', ip: '192.168.1.12', port: 8892, battery: 17},
]

let curDroneId = ref(droneList[0].id);

function batteryColor(percent) {
  if (percent > 60) return 'positive'     // Quasar 主题色
  if (percent > 30) return 'warning'
  return 'negative'
}

function selectDrone(drone) {
  curDroneId.value = drone.id;
  expanded.value = false
}

</script>

<style scoped>
.tech-expansion {
  background: transparent;
}

.tech-item {
  background: rgba(74, 144, 226, 0.05);
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.3s ease;
}

.tech-item:hover {
  background: rgba(74, 144, 226, 0.1);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.2);
}

.tech-avatar {
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.3);
}

.tech-text {
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.tech-text-secondary {
  color: #4A90E2;
  text-shadow: 0 0 5px rgba(74, 144, 226, 0.2);
}
</style>

