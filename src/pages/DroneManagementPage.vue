<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">无人机连接管理</div>
        <div class="text-subtitle2 text-grey-7">请手动确认是否允许新连接的无人机加入系统</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          :rows="pendingClients"
          :columns="columns"
          row-key="id"
          flat bordered dense
          no-data-label="暂无待确认连接的无人机"
        >
          <template v-slot:body-cell-action="props">
            <q-td>
              <q-btn color="primary" size="sm" @click="confirmConnection(props.row)">确认</q-btn>
              <q-btn color="negative" size="sm" flat class="q-ml-sm" @click="rejectConnection(props.row)">拒绝</q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useDroneStore } from 'stores/drone'
import { api } from 'boot/axios'

const droneStore = useDroneStore()

const pendingClients = ref([])

const columns = [
  { name: 'id', label: '客户端ID', align: 'left', field: 'id' },
  { name: 'ip', label: 'IP地址', align: 'left', field: 'ip' },
  { name: 'name', label: '设备名称', align: 'left', field: 'name' },
  { name: 'action', label: '操作', align: 'center' }
]

// 获取待确认的无人机连接列表
async function fetchPendingClients() {
  try {
    const res = await api.get('/api/pending-clients')
    pendingClients.value = res.data.clients || []
  } catch (e) {
    console.error('获取待确认连接失败:', e.message)
  }
}

async function confirmConnection(client) {
  try {
    await api.post('/api/approve-client', { client_id: client.id })
    droneStore.addLog(`已确认连接无人机 ${client.id}`)
    pendingClients.value = pendingClients.value.filter(c => c.id !== client.id)
    await droneStore.fetchClients() // 更新无人机列表
  } catch (e) {
    console.error('确认失败:', e.message)
  }
}

async function rejectConnection(client) {
  try {
    await api.post('/api/reject-client', { client_id: client.id })
    droneStore.addLog(`已拒绝连接无人机 ${client.id}`)
    pendingClients.value = pendingClients.value.filter(c => c.id !== client.id)
  } catch (e) {
    console.error('拒绝失败:', e.message)
  }
}

onMounted(fetchPendingClients)
</script>

<style scoped>
.q-btn {
  min-width: 64px;
}
</style>
