<template>
  <q-page class="scene-setup-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <q-btn flat icon="arrow_back" label="返回" @click="goBack" />
      <div class="toolbar-title">任务场景设置</div>
      <q-space />
      <q-btn flat label="保存配置" color="primary" @click="saveConfiguration" :disable="!hasRoutes" />
      <q-btn flat label="导出配置" @click="exportConfiguration" :disable="!hasRoutes" />
    </div>

    <!-- 主内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧地图区域 -->
      <div class="map-container">
        <!-- 地图加载提示 -->
        <div v-if="!mapInstance" class="map-loading">
          <q-spinner color="primary" size="50px" />
          <div class="loading-text">正在加载地图...</div>
        </div>

        <div id="amap-container" ref="mapContainer"></div>

        <transition name="overlay-slide">
          <div v-if="mapInstance && planningPanelOpen" class="planning-overlay">
            <div class="overlay-container">
              <div class="overlay-header">
                <div class="overlay-title">
                  <q-icon name="auto_awesome_motion" size="18px" />
                  <span>任务规划面板</span>
                </div>
                <q-btn dense flat round icon="close" color="grey-5" @click="planningPanelOpen = false" />
              </div>
              <div class="overlay-columns">
                <div class="overlay-panel primary-panel">
                  <div class="panel-header">
                    <div>
                      <div class="panel-title">AI 任务编排</div>
                      <div class="panel-subtitle">承接 AiTaskPlanningPage 输出</div>
                    </div>
                    <q-badge color="primary" label="智能" />
                  </div>

                  <div class="panel-section">
                    <div class="section-title">任务参数</div>
                    <div class="section-grid">
                      <q-select
                        dense
                        filled
                        label="任务类型"
                        v-model="missionForm.missionType"
                        :options="missionTypeOptions"
                        emit-value
                        map-options
                      />
                      <q-input
                        dense
                        filled
                        type="number"
                        min="1"
                        label="无人机数量"
                        v-model.number="missionForm.droneCount"
                      />
                      <q-input
                        dense
                        filled
                        type="number"
                        label="巡航高度 (m)"
                        v-model.number="missionForm.altitude"
                        min="10"
                      />
                      <q-input
                        dense
                        filled
                        type="number"
                        label="巡航速度 (m/s)"
                        v-model.number="missionForm.speed"
                        min="1"
                      />
                    </div>
                  </div>

                  <q-separator dark spaced />

                  <div class="panel-section">
                    <div class="section-title">起止点选择</div>
                    <div class="section-grid">
                      <q-select
                        dense
                        filled
                        emit-value
                        map-options
                        label="起飞点"
                        v-model="missionForm.startPointId"
                        :options="campusPointOptions"
                        :loading="campusPointsLoading"
                        hint="仅可选择授权校园点"
                      >
                        <template #append>
                          <div class="append-actions">
                            <q-btn
                              flat
                              round
                              dense
                              icon="ads_click"
                              :disable="!campusPointOptions.length"
                              @click.stop="beginMapSelection('start')"
                            />
                            <q-btn
                              flat
                              round
                              dense
                              icon="my_location"
                              @click.stop="focusOnSelection('start')"
                              :disable="!missionForm.startPointId"
                            />
                          </div>
                        </template>
                      </q-select>
                      <q-select
                        dense
                        filled
                        emit-value
                        map-options
                        label="目标点"
                        v-model="missionForm.endPointId"
                        :options="campusPointOptions"
                        :loading="campusPointsLoading"
                      >
                        <template #append>
                          <div class="append-actions">
                            <q-btn
                              flat
                              round
                              dense
                              icon="task_alt"
                              :disable="!campusPointOptions.length"
                              @click.stop="beginMapSelection('end')"
                            />
                            <q-btn
                              flat
                              round
                              dense
                              icon="assistant_direction"
                              @click.stop="focusOnSelection('end')"
                              :disable="!missionForm.endPointId"
                            />
                          </div>
                        </template>
                      </q-select>
                    </div>
                  </div>

                  <div v-if="selectionMode" class="selection-banner">
                    <q-icon name="touch_app" class="q-mr-sm" />
                    在地图上点击校园点以选择 {{ selectionMode === 'start' ? '起飞点' : '目标点' }}
                  </div>

                  <div class="legend-row">
                    <q-chip color="primary" text-color="white" dense square>校园预设点</q-chip>
                    <q-chip color="orange" text-color="white" dense square>起飞点高亮</q-chip>
                    <q-chip color="teal" text-color="white" dense square>禁飞区</q-chip>
                  </div>

                  <div class="panel-actions">
                    <q-btn
                      unelevated
                      color="primary"
                      label="一键生成航迹"
                      icon="auto_awesome"
                      :disable="!canPlanMission || loading"
                      @click="planMission"
                    />
                    <q-btn
                      flat
                      color="secondary"
                      label="刷新禁飞区"
                      icon="radar"
                      @click="loadPresetNoFlyZones"
                    />
                    <q-btn
                      flat
                      color="grey-7"
                      label="重置场景"
                      icon="restart_alt"
                      @click="resetScene"
                    />
                  </div>
                </div>

                <div class="overlay-panel log-panel">
                  <div class="panel-header">
                    <div>
                      <div class="panel-title">任务事件记录</div>
                      <div class="panel-subtitle">追踪路线规划与操作反馈</div>
                    </div>
                    <q-badge :label="missionLog.length" color="secondary" />
                  </div>
                  <q-scroll-area class="log-scroll">
                    <div v-if="missionLog.length === 0" class="log-empty">
                      暂无事件，等待任务交互...
                    </div>
                    <div v-for="(entry, idx) in missionLog" :key="idx" class="log-entry">
                      <div class="log-time">{{ entry.time }}</div>
                      <div class="log-text">{{ entry.message }}</div>
                    </div>
                  </q-scroll-area>
                </div>
              </div>

              <div class="edit-indicator" v-if="editMode">
                <q-badge color="orange" :label="editModeLabel" />
              </div>
            </div>
          </div>
        </transition>

        <div v-if="mapInstance" class="overlay-floaters">
          <transition name="fade">
            <div v-if="!planningPanelOpen" class="overlay-toggle">
              <q-btn
                unelevated
                color="primary"
                icon="dashboard_customize"
                label="任务面板"
                @click="planningPanelOpen = true"
              >
                <q-tooltip anchor="bottom middle" self="top middle">展开任务设置</q-tooltip>
              </q-btn>
            </div>
          </transition>
          <transition name="fade">
            <div v-if="!planningPanelOpen && selectionMode" class="selection-pill">
              <q-icon name="touch_app" class="q-mr-xs" />
              <span>点击校园点设置{{ selectionMode === 'start' ? '起飞点' : '目标点' }}</span>
            </div>
          </transition>
          <transition name="fade">
            <div v-if="!planningPanelOpen && editMode" class="edit-pill">
              <q-icon name="build" class="q-mr-xs" />
              <span>{{ editModeLabel }}</span>
            </div>
          </transition>
        </div>

        <!-- 地图工具栏 -->
        <MapToolbar
          v-if="mapInstance"
          :edit-mode="editMode"
          :no-fly-zone-count="noFlyZones.length"
          :waypoint-count="waypoints.length"
          @add-nofly-zone="startAddNoFlyZone"
          @add-waypoint="startAddWaypoint"
          @edit-start="startEditStart"
          @edit-end="startEditEnd"
          @generate-route="generateRoute"
          @cancel-edit="cancelEdit"
        />
      </div>

      <!-- 右侧参数面板 -->
      <ParameterPanel
        :task-data="taskData"
        :no-fly-zones="noFlyZones"
        :waypoints="waypoints"
        :routes="routes"
        :selected-item="selectedItem"
        @update-nofly-zone="updateNoFlyZone"
        @delete-nofly-zone="deleteNoFlyZone"
        @update-waypoint="updateWaypoint"
        @delete-waypoint="deleteWaypoint"
        @select-item="selectItem"
      />
    </div>

    <!-- 加载提示 -->
    <q-dialog v-model="loading" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-spinner color="primary" size="3em" />
          <span class="q-ml-md">{{ loadingMessage }}</span>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>


<script>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import MapToolbar from 'src/components/mission/MapToolbar.vue'
import ParameterPanel from 'src/components/mission/ParameterPanel.vue'
import { api } from 'src/boot/axios'
import { useMissionStore } from 'src/stores/mission'

export default {
  name: 'SceneSetupPage',
  components: {
    MapToolbar,
    ParameterPanel
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const $q = useQuasar()
    const missionStore = useMissionStore()

    // 状态管理
    const mapContainer = ref(null)
    const mapInstance = ref(null)
    const taskData = ref({
      num_uavs: 1,
      mission_type: 'patrol',
      start_point: null,
      end_point: null,
      waypoints: []
    })
    const editMode = ref(null) // 'nofly-zone', 'waypoint', 'start', 'end', null
    const loading = ref(false)
    const loadingMessage = ref('')

    // 地图对象
    const startMarker = ref(null)
    const endMarker = ref(null)
    const noFlyZones = ref([])
    const waypoints = ref([])
    const routes = ref([])
    const selectedItem = ref(null)
    const campusPoints = ref([])
    const campusPointsLoading = ref(false)
    const missionLog = ref([])
    const droneMarkers = ref([])
    const pendingSelections = reactive({ start: null, end: null })
    const selectionOverrides = reactive({ start: null, end: null })
    const campusPointMarkers = ref([])
    const campusPointLabels = ref([])
    const nfzPolygons = ref([])
    const selectionMode = ref(null)
    const planningPanelOpen = ref(false)
    const missionForm = reactive({
      missionType: 'patrol',
      droneCount: 1,
      startPointId: null,
      endPointId: null,
      altitude: 60,
      speed: 12,
      holdTime: 10
    })

    const missionTypeOptions = [
      { label: '巡逻侦察', value: 'patrol' },
      { label: '应急响应', value: 'inspection' },
      { label: '物资投送', value: 'delivery' },
      { label: '编队演示', value: 'formation' }
    ]

    // 计算属性
    const hasRoutes = computed(() => routes.value.length > 0)
    const campusPointOptions = computed(() => campusPoints.value.map(point => ({
      label: point.name,
      value: point.id
    })))
    const selectedStartPoint = computed(() =>
      campusPoints.value.find(point => point.id === missionForm.startPointId) || null
    )
    const selectedEndPoint = computed(() =>
      campusPoints.value.find(point => point.id === missionForm.endPointId) || null
    )
    const canPlanMission = computed(() =>
      Boolean(selectedStartPoint.value && selectedEndPoint.value && missionForm.droneCount > 0)
    )
    const editModeLabel = computed(() => {
      if (!editMode.value) return ''
      const mapper = {
        'start': '选择起点',
        'end': '选择终点',
        'nofly-zone': '添加禁飞区',
        'waypoint': '添加必经点'
      }
      return mapper[editMode.value] || '编辑中'
    })

    const logMissionEvent = (message) => {
      missionLog.value.unshift({
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        message
      })
      if (missionLog.value.length > 30) {
        missionLog.value.pop()
      }
    }

    const normalizeCoordinates = (coords) => {
      if (!coords) return null
      const latitude = Number(coords.latitude ?? coords.lat)
      const longitude = Number(coords.longitude ?? coords.lng)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
      }
      return { latitude, longitude }
    }

    const normalizeCampusPoint = (point, index) => {
      if (!point) return null
      const latitude = Number(point.latitude ?? point.lat)
      const longitude = Number(point.longitude ?? point.lng)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
      }
      return {
        id: point.id || point.code || `campus-${index}`,
        name: point.name || `点位${index + 1}`,
        latitude,
        longitude,
        raw: point
      }
    }

    const matchPointByCoordinates = (coords) => {
      const normalized = normalizeCoordinates(coords)
      if (!normalized) return null
      const EPSILON = 1e-6
      return campusPoints.value.find(point =>
        Math.abs(point.latitude - normalized.latitude) < EPSILON &&
        Math.abs(point.longitude - normalized.longitude) < EPSILON
      ) || null
    }

    const focusOnPoint = (lng, lat) => {
      if (!mapInstance.value || !Number.isFinite(lng) || !Number.isFinite(lat)) {
        return
      }
      mapInstance.value.setZoomAndCenter(17, [lng, lat])
    }

    const focusOnSelection = (type) => {
      if (type === 'start' && selectedStartPoint.value) {
        focusOnPoint(selectedStartPoint.value.longitude, selectedStartPoint.value.latitude)
      } else if (type === 'end' && selectedEndPoint.value) {
        focusOnPoint(selectedEndPoint.value.longitude, selectedEndPoint.value.latitude)
      }
    }

    const beginMapSelection = (mode) => {
      if (!campusPoints.value.length) {
        $q.notify({ type: 'warning', message: '尚未加载校园预设点' })
        return
      }
      if (selectionMode.value === mode) {
        selectionMode.value = null
        $q.notify({ type: 'info', message: '已退出地图选点模式', position: 'top' })
        return
      }
      selectionMode.value = mode
      logMissionEvent(`请在地图上点击校园点以设置${mode === 'start' ? '起飞点' : '目标点'}`)
      $q.notify({ type: 'info', message: '地图选点模式已开启', position: 'top' })
    }

    const clearCampusPointOverlays = () => {
      campusPointMarkers.value.forEach(item => mapInstance.value && mapInstance.value.remove(item.marker))
      campusPointLabels.value.forEach(label => mapInstance.value && mapInstance.value.remove(label))
      campusPointMarkers.value = []
      campusPointLabels.value = []
    }

    const refreshCampusPointStyles = () => {
      campusPointMarkers.value.forEach(({ point, marker }) => {
        if (!marker) return
        const isStart = missionForm.startPointId === point.id
        const isEnd = missionForm.endPointId === point.id
        let fillColor = '#6366f1'
        if (isStart && isEnd) {
          fillColor = '#ec4899'
        } else if (isStart) {
          fillColor = '#f97316'
        } else if (isEnd) {
          fillColor = '#14b8a6'
        }
        marker.setOptions({
          fillColor,
          radius: isStart || isEnd ? 8 : 6,
          zIndex: isStart || isEnd ? 60 : 40
        })
      })
    }

    const handleCampusPointClick = (point) => {
      if (!selectionMode.value) {
        focusOnPoint(point.longitude, point.latitude)
        $q.notify({ type: 'info', message: `${point.name} 已聚焦`, position: 'top' })
        return
      }

      if (selectionMode.value === 'start') {
        missionForm.startPointId = point.id
        logMissionEvent(`起飞点更新为 ${point.name}`)
      } else if (selectionMode.value === 'end') {
        missionForm.endPointId = point.id
        logMissionEvent(`目标点更新为 ${point.name}`)
      }

      selectionMode.value = null
      $q.notify({ type: 'positive', message: '地图选点完成', position: 'top' })
    }

    const renderCampusPoints = () => {
      if (!mapInstance.value || !campusPoints.value.length) {
        return
      }
      clearCampusPointOverlays()
      campusPoints.value.forEach((point) => {
        const marker = new window.AMap.CircleMarker({
          center: [point.longitude, point.latitude],
          radius: 6,
          fillColor: '#6366f1',
          strokeColor: '#ffffff',
          strokeWeight: 2,
          fillOpacity: 0.95,
          cursor: 'pointer',
          zIndex: 40
        })
        marker.on('click', () => handleCampusPointClick(point))
        mapInstance.value.add(marker)

        const label = new window.AMap.Text({
          text: point.name,
          position: [point.longitude, point.latitude],
          offset: new window.AMap.Pixel(0, -22),
          style: {
            'background': 'rgba(17, 24, 39, 0.72)',
            'padding': '3px 8px',
            'border-radius': '12px',
            'color': '#f8fafc',
            'font-size': '11px',
            'border': 'none'
          },
          zIndex: 45
        })
        mapInstance.value.add(label)

        campusPointMarkers.value.push({ point, marker })
        campusPointLabels.value.push(label)
      })
      refreshCampusPointStyles()
    }

    const clearPresetNoFlyZones = () => {
      nfzPolygons.value.forEach(poly => mapInstance.value && mapInstance.value.remove(poly))
      nfzPolygons.value = []
    }

    const loadPresetNoFlyZones = async () => {
      if (!mapInstance.value) return
      try {
        const center = mapInstance.value.getCenter()
        const params = {}
        if (center) {
          params.lat = center.getLat()
          params.lon = center.getLng()
        }
        const response = await api.get('/api/no-fly-zones', { params })
        const zonesPayload = Array.isArray(response.data?.zones)
          ? response.data.zones
          : Array.isArray(response.data)
            ? response.data
            : []

        clearPresetNoFlyZones()

        let created = 0
        zonesPayload.forEach((zone, zoneIndex) => {
          const rawPoints = Array.isArray(zone?.points) ? zone.points : zone
          if (!Array.isArray(rawPoints)) return
          const path = rawPoints
            .map((p) => {
              const lat = Number(p.lat ?? p.latitude)
              const lng = Number(p.lon ?? p.longitude)
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return null
              }
              return [lng, lat]
            })
            .filter(Boolean)

          if (path.length < 3) {
            return
          }

          const polygon = new window.AMap.Polygon({
            path,
            strokeColor: '#14b8a6',
            strokeWeight: 2,
            strokeOpacity: 0.9,
            fillColor: 'rgba(20,184,166,0.25)',
            fillOpacity: 0.35,
            zIndex: 30
          })

          polygon.on('mouseover', () => polygon.setOptions({ fillOpacity: 0.5 }))
          polygon.on('mouseout', () => polygon.setOptions({ fillOpacity: 0.35 }))

          mapInstance.value.add(polygon)
          nfzPolygons.value.push(polygon)
          created += 1
        })

        if (created > 0) {
          logMissionEvent(`已加载 ${created} 个预设禁飞区`)
        } else {
          logMissionEvent('未检索到预设禁飞区数据')
        }
      } catch (error) {
        console.error('加载预设禁飞区失败:', error)
        $q.notify({ type: 'negative', message: '加载禁飞区失败，请稍后重试' })
      }
    }

    const applyPendingSelections = () => {
      if (pendingSelections.start) {
        applyStartSelection(pendingSelections.start.point, pendingSelections.start.options)
        pendingSelections.start = null
      }
      if (pendingSelections.end) {
        applyEndSelection(pendingSelections.end.point, pendingSelections.end.options)
        pendingSelections.end = null
      }
    }

    const applyStartSelection = (point, options = {}) => {
      if (!point) return
      if (!mapInstance.value) {
        pendingSelections.start = { point, options }
        return
      }
      updateStartPoint(point.longitude, point.latitude, { silent: options?.skipNotify })
      taskData.value.start_point = {
        lat: point.latitude,
        lng: point.longitude,
        name: point.name,
        id: point.id
      }
      if (!options?.skipLog) {
        logMissionEvent(`起点设置为 ${point.name}`)
      }
      focusOnPoint(point.longitude, point.latitude)
      refreshCampusPointStyles()
    }

    const applyEndSelection = (point, options = {}) => {
      if (!point) return
      if (!mapInstance.value) {
        pendingSelections.end = { point, options }
        return
      }
      updateEndPoint(point.longitude, point.latitude, { silent: options?.skipNotify })
      taskData.value.end_point = {
        lat: point.latitude,
        lng: point.longitude,
        name: point.name,
        id: point.id
      }
      if (!options?.skipLog) {
        logMissionEvent(`终点设置为 ${point.name}`)
      }
      focusOnPoint(point.longitude, point.latitude)
      refreshCampusPointStyles()
    }

    const prefillMissionFormFromTask = () => {
      const sourceMission = missionStore.currentMission || taskData.value
      if (!sourceMission) return
      missionForm.droneCount = sourceMission.droneCount || sourceMission.num_uavs || missionForm.droneCount
      missionForm.missionType = sourceMission.mission_type || getMissionType(sourceMission.taskType || sourceMission.taskName)
      taskData.value.num_uavs = missionForm.droneCount
      taskData.value.mission_type = missionForm.missionType
      taskData.value.name = sourceMission.taskName || sourceMission.description

      const startCandidate = sourceMission.start_point || sourceMission.startPointCoordinates || sourceMission.startPoint
      const endCandidate = sourceMission.end_point || sourceMission.targetPointCoordinates || sourceMission.targetPoint

      const matchedStart = matchPointByCoordinates(startCandidate)
      const matchedEnd = matchPointByCoordinates(endCandidate)

      if (matchedStart) {
        selectionOverrides.start = { skipLog: true, skipNotify: true }
        missionForm.startPointId = matchedStart.id
      } else if (startCandidate?.lng && startCandidate?.lat) {
        applyStartSelection({
          id: startCandidate.id || 'custom-start',
          name: startCandidate.name || sourceMission.startPoint || '起点',
          longitude: startCandidate.lng,
          latitude: startCandidate.lat
        }, { skipLog: true, skipNotify: true })
      }

      if (matchedEnd) {
        selectionOverrides.end = { skipLog: true, skipNotify: true }
        missionForm.endPointId = matchedEnd.id
      } else if (endCandidate?.lng && endCandidate?.lat) {
        applyEndSelection({
          id: endCandidate.id || 'custom-end',
          name: endCandidate.name || sourceMission.targetPoint || '终点',
          longitude: endCandidate.lng,
          latitude: endCandidate.lat
        }, { skipLog: true, skipNotify: true })
      }
    }

    const loadCampusPoints = async () => {
      campusPointsLoading.value = true
      try {
        const response = await api.get('/api/campus-points')
        const rawPoints = Array.isArray(response.data?.points) ? response.data.points : []
        const normalized = rawPoints
          .map((point, index) => normalizeCampusPoint(point, index))
          .filter(Boolean)
        campusPoints.value = normalized
        renderCampusPoints()
        logMissionEvent(`已加载 ${normalized.length} 个授权校园点`)
        prefillMissionFormFromTask()
      } catch (error) {
        console.error('加载校园点失败:', error)
        $q.notify({
          type: 'negative',
          message: '加载校园点失败，请检查登录状态或网络'
        })
      } finally {
        campusPointsLoading.value = false
      }
    }

    watch(() => missionForm.droneCount, (value) => {
      const count = Math.max(1, Number(value) || 1)
      taskData.value.num_uavs = count
      missionForm.droneCount = count
    })

    watch(() => missionForm.missionType, (value) => {
      if (value) {
        taskData.value.mission_type = value
      }
    })

    watch(campusPoints, () => {
      renderCampusPoints()
    })

    watch(() => missionForm.startPointId, (id, prev) => {
      if (id && id !== prev) {
        const point = campusPoints.value.find(p => p.id === id)
        const overrides = selectionOverrides.start || {}
        if (point) {
          applyStartSelection(point, overrides)
        }
        selectionOverrides.start = null
      } else if (!id) {
        taskData.value.start_point = null
      }
      selectionMode.value = null
      refreshCampusPointStyles()
    })

    watch(() => missionForm.endPointId, (id, prev) => {
      if (id && id !== prev) {
        const point = campusPoints.value.find(p => p.id === id)
        const overrides = selectionOverrides.end || {}
        if (point) {
          applyEndSelection(point, overrides)
        }
        selectionOverrides.end = null
      } else if (!id) {
        taskData.value.end_point = null
      }
      selectionMode.value = null
      refreshCampusPointStyles()
    })

    const persistMissionSnapshot = () => {
      const snapshot = {
        ...(missionStore.currentMission || {}),
        taskName: taskData.value.name || 'AI 任务',
        taskType: missionForm.missionType,
        droneCount: missionForm.droneCount,
        startPoint: taskData.value.start_point?.name,
        targetPoint: taskData.value.end_point?.name,
        start_point: taskData.value.start_point,
        end_point: taskData.value.end_point,
        noFlyZones: noFlyZones.value.map(zone => ({
          center: zone.center,
          radius: zone.radius,
          name: zone.name
        })),
        waypoints: waypoints.value.map(wp => ({
          lat: wp.lat,
          lng: wp.lng,
          name: wp.name,
          sequence: wp.sequence
        })),
        routes: routes.value
      }
      missionStore.setCurrentMission(snapshot)
    }

    // 初始化地图
    const initMap = () => {
      console.log('开始初始化地图...')
      console.log('window.AMap:', window.AMap)
      console.log('DOM元素:', document.getElementById('amap-container'))

      if (!window.AMap) {
        console.error('高德地图 API 未加载')
        $q.notify({
          type: 'negative',
          message: '高德地图加载失败，请检查网络连接或刷新页面'
        })
        return
      }

      try {
        // 创建地图实例
        console.log('创建地图实例...')
        const map = new window.AMap.Map('amap-container', {
          zoom: 15,
          center: [118.8255, 31.9370], // 南航将军路校区
          mapStyle: 'amap://styles/normal',
          viewMode: '2D'
        })

        console.log('地图实例创建成功:', map)

        // 立即设置mapInstance，这样loading就会消失
        mapInstance.value = map

        // 等待地图加载完成后显示通知
        map.on('complete', () => {
          console.log('地图加载完成')
          $q.notify({
            type: 'positive',
            message: '地图加载成功',
            position: 'top'
          })
          applyPendingSelections()
          renderCampusPoints()
          loadPresetNoFlyZones()
        })

        // 添加地图点击事件
        map.on('click', handleMapClick)

      } catch (error) {
        console.error('地图初始化失败:', error)
        $q.notify({
          type: 'negative',
          message: '地图初始化失败: ' + error.message
        })
      }
    }


    // 处理地图点击
    const handleMapClick = (e) => {
      const lnglat = e.lnglat

      if (editMode.value === 'start') {
        updateStartPoint(lnglat.lng, lnglat.lat)
        editMode.value = null
        logMissionEvent('已在地图上重新设置起点')
      } else if (editMode.value === 'end') {
        updateEndPoint(lnglat.lng, lnglat.lat)
        editMode.value = null
        logMissionEvent('已在地图上重新设置终点')
      } else if (editMode.value === 'nofly-zone') {
        addNoFlyZone(lnglat.lng, lnglat.lat)
        editMode.value = null
        logMissionEvent('新增禁飞区')
      } else if (editMode.value === 'waypoint') {
        addWaypoint(lnglat.lng, lnglat.lat)
        editMode.value = null
        logMissionEvent('新增必经点')
      }
    }

    const planMission = async () => {
      if (!canPlanMission.value) {
        $q.notify({ type: 'warning', message: '请先选择合法的起点和终点' })
        return
      }

      const startPoint = selectedStartPoint.value
      const endPoint = selectedEndPoint.value

      taskData.value.start_point = {
        lat: startPoint.latitude,
        lng: startPoint.longitude,
        name: startPoint.name,
        id: startPoint.id
      }
      taskData.value.end_point = {
        lat: endPoint.latitude,
        lng: endPoint.longitude,
        name: endPoint.name,
        id: endPoint.id
      }

      persistMissionSnapshot()

      logMissionEvent(`提交规划：${missionForm.droneCount} 架无人机从 ${startPoint.name} 到 ${endPoint.name}`)
      await generateRoute()
    }

    // 更新起点
    const updateStartPoint = (lng, lat, options = {}) => {
      console.log('updateStartPoint 被调用:', lng, lat)

      // 验证坐标有效性
      if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
        console.error('无效的起点坐标:', lng, lat)
        return
      }

      // 确保taskData存在start_point属性
      if (!taskData.value.start_point) {
        taskData.value.start_point = {}
      }

      if (startMarker.value) {
        startMarker.value.setPosition([lng, lat])
        console.log('起点标记位置已更新')
      } else {
        try {
          startMarker.value = new window.AMap.Marker({
            position: [lng, lat],
            draggable: true,
            title: '起点',
            label: {
              content: '起点',
              offset: new window.AMap.Pixel(0, -30),
              direction: 'top'
            }
          })

          // 设置红色图标 - 使用更可靠的图标
          const icon = new window.AMap.Icon({
            size: new window.AMap.Size(25, 34),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
            imageSize: new window.AMap.Size(25, 34)
          })
          startMarker.value.setIcon(icon)

          mapInstance.value.add(startMarker.value)

          startMarker.value.on('dragend', (e) => {
            const pos = e.target.getPosition()
            taskData.value.start_point = { lng: pos.lng, lat: pos.lat }
          })

          console.log('起点标记创建成功，位置:', [lng, lat])
        } catch (error) {
          console.error('创建起点标记失败:', error)
        }
      }

      taskData.value.start_point = { lng, lat }
      if (!options.silent) {
        $q.notify({ type: 'positive', message: '起点已更新' })
      }
    }

    // 更新终点
    const updateEndPoint = (lng, lat, options = {}) => {
      console.log('updateEndPoint 被调用:', lng, lat)

      // 验证坐标有效性
      if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
        console.error('无效的终点坐标:', lng, lat)
        return
      }

      // 确保taskData存在end_point属性
      if (!taskData.value.end_point) {
        taskData.value.end_point = {}
      }

      if (endMarker.value) {
        endMarker.value.setPosition([lng, lat])
        console.log('终点标记位置已更新')
      } else {
        try {
          endMarker.value = new window.AMap.Marker({
            position: [lng, lat],
            draggable: true,
            title: '终点',
            label: {
              content: '终点',
              offset: new window.AMap.Pixel(0, -30),
              direction: 'top'
            }
          })

          // 设置绿色图标 - 使用更可靠的图标
          const icon = new window.AMap.Icon({
            size: new window.AMap.Size(25, 34),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
            imageSize: new window.AMap.Size(25, 34)
          })
          endMarker.value.setIcon(icon)

          mapInstance.value.add(endMarker.value)

          endMarker.value.on('dragend', (e) => {
            const pos = e.target.getPosition()
            taskData.value.end_point = { lng: pos.lng, lat: pos.lat }
          })

          console.log('终点标记创建成功，位置:', [lng, lat])
        } catch (error) {
          console.error('创建终点标记失败:', error)
        }
      }

      taskData.value.end_point = { lng, lat }
      if (!options.silent) {
        $q.notify({ type: 'positive', message: '终点已更新' })
      }
    }


    // 添加禁飞区
    const addNoFlyZone = (lng, lat) => {
      if (noFlyZones.value.length >= 10) {
        $q.notify({ type: 'warning', message: '最多只能添加10个禁飞区' })
        return
      }

      const circle = new window.AMap.Circle({
        center: [lng, lat],
        radius: 100, // 默认半径100米
        fillColor: '#ff0000',
        fillOpacity: 0.3,
        strokeColor: '#ff0000',
        strokeWeight: 2,
        draggable: true,
        cursor: 'move'
      })

      const zone = {
        id: Date.now(),
        circle,
        center: { lng, lat },
        radius: 100,
        name: `禁飞区${noFlyZones.value.length + 1}`
      }

      circle.on('click', () => selectItem(zone))
      circle.on('dragend', (e) => {
        const center = e.target.getCenter()
        zone.center = { lng: center.lng, lat: center.lat }
      })

      mapInstance.value.add(circle)
      noFlyZones.value.push(zone)
      $q.notify({ type: 'positive', message: '禁飞区已添加' })
      logMissionEvent(`添加禁飞区 ${zone.name}`)
      persistMissionSnapshot()
    }

    const loadNoFlyZonesFromTask = () => {
      if (!mapInstance.value) return
      const source = taskData.value.no_fly_zones || missionStore.currentMission?.noFlyZones || []
      if (!Array.isArray(source)) return

      noFlyZones.value.forEach(zone => zone.circle && mapInstance.value.remove(zone.circle))
      noFlyZones.value = []

      source.forEach((zone, index) => {
        if (!zone?.center) return
        const lat = Number(zone.center.lat ?? zone.center.latitude)
        const lng = Number(zone.center.lng ?? zone.center.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        const radius = Number(zone.radius) || 100
        const circle = new window.AMap.Circle({
          center: [lng, lat],
          radius,
          fillColor: '#ff0000',
          fillOpacity: 0.25,
          strokeColor: '#ff0000',
          strokeWeight: 2
        })

        const zoneModel = {
          id: Date.now() + index,
          circle,
          center: { lng, lat },
          radius,
          name: zone.name || `禁飞区${index + 1}`
        }

        circle.on('click', () => selectItem(zoneModel))
        mapInstance.value.add(circle)
        noFlyZones.value.push(zoneModel)
      })

      if (noFlyZones.value.length) {
        logMissionEvent(`已载入 ${noFlyZones.value.length} 个禁飞区`)
      }
    }

    // 添加必经点
    const addWaypoint = (lng, lat) => {
      if (waypoints.value.length >= 20) {
        $q.notify({ type: 'warning', message: '最多只能添加20个必经点' })
        return
      }

      try {
        const marker = new window.AMap.Marker({
          position: [lng, lat],
          draggable: true,
          title: `必经点${waypoints.value.length + 1}`
        })

        // 设置蓝色图标
        marker.setIcon('//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png')

        const waypoint = {
          id: Date.now(),
          marker,
          lat,
          lng,
          sequence: waypoints.value.length,
          name: `必经点${waypoints.value.length + 1}`
        }

        marker.on('click', () => selectItem(waypoint))
        marker.on('dragend', (e) => {
          const pos = e.target.getPosition()
          waypoint.lat = pos.lat
          waypoint.lng = pos.lng
        })

        mapInstance.value.add(marker)
        waypoints.value.push(waypoint)
        $q.notify({ type: 'positive', message: '必经点已添加' })
        logMissionEvent(`添加必经点 ${waypoint.name}`)
        persistMissionSnapshot()
      } catch (error) {
        console.error('添加必经点失败:', error)
        $q.notify({ type: 'negative', message: '添加必经点失败: ' + error.message })
      }
    }

    const loadWaypointsFromTask = () => {
      if (!mapInstance.value || !Array.isArray(taskData.value.waypoints)) {
        return
      }

      waypoints.value.forEach(wp => {
        if (wp.marker) {
          mapInstance.value.remove(wp.marker)
        }
      })
      waypoints.value = []

      taskData.value.waypoints.forEach((wp, index) => {
        if (!wp || !Number.isFinite(wp.lat) || !Number.isFinite(wp.lng)) {
          return
        }
        const waypoint = {
          id: Date.now() + index,
          lat: wp.lat,
          lng: wp.lng,
          sequence: index,
          name: wp.name || `航迹点${index + 1}`,
          marker: null
        }

        const marker = new window.AMap.Marker({
          position: [wp.lng, wp.lat],
          draggable: true,
          title: waypoint.name,
          label: {
            content: waypoint.name,
            offset: new window.AMap.Pixel(0, -30),
            direction: 'top'
          }
        })

        const icon = new window.AMap.Icon({
          size: new window.AMap.Size(25, 34),
          image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
          imageSize: new window.AMap.Size(25, 34)
        })
        marker.setIcon(icon)

        marker.on('dragend', (event) => {
          const pos = event.target.getPosition()
          waypoint.lat = pos.lat
          waypoint.lng = pos.lng
        })

        marker.on('click', () => selectItem(waypoint))

        mapInstance.value.add(marker)
        waypoint.marker = marker
        waypoints.value.push(waypoint)
      })

      if (waypoints.value.length) {
        logMissionEvent(`已载入 ${waypoints.value.length} 个航迹点`)
        mapInstance.value.setFitView()
      }
    }
// --- 新增：调用 A* 接口计算单段路径 ---
    const fetchAStarPath = async (start, end) => {
      try {
        // 构造 A* 请求参数
        const payload = {
          start: {
            lat: start.latitude ?? start.lat,
            lon: start.longitude ?? start.lng
          },
          end: {
            lat: end.latitude ?? end.lat,
            lon: end.longitude ?? end.lng
          },
          step_meters: 40 // 设置步长，可根据需求调整
        }

        const response = await api.post('/api/calculate-route', payload)

        if (response.data && response.data.status === 'success') {
          // 返回格式化的坐标数组 [[lng, lat], ...]
          return response.data.route.map(p => ({
            lng: p.lon,
            lat: p.lat,
            latitude: p.lat,
            longitude: p.lon
          }))
        }
      } catch (e) {
        console.warn('A* 避障计算失败，回退到直线:', e)
      }
      return null // 失败返回 null
    }

    // --- 新增：处理单个无人机的整条路径 ---
    const refineRouteWithAStar = async (baseRoute) => {
      const wps = baseRoute.waypoints
      if (!wps || wps.length < 2) return { ...baseRoute, detailedPath: wps }

      let fullPath = []

      // 遍历每一段 (Start -> WP1 -> WP2 -> End)
      for (let i = 0; i < wps.length - 1; i++) {
        const p1 = wps[i]
        const p2 = wps[i + 1]

        // 计算当前段的 A* 路径
        const segmentPath = await fetchAStarPath(p1, p2)

        if (segmentPath && segmentPath.length > 0) {
          // 如果不是第一段，去掉头部（因为上一段的尾部和这一段的头部是同一个点）
          if (i > 0) segmentPath.shift()
          fullPath = fullPath.concat(segmentPath)
        } else {
          // 失败回退：直接连接 P2
          fullPath.push(p2)
        }
      }

      // 确保起点在路径中
      if (fullPath.length > 0) {
         // 检查起点是否丢失（A*返回的第一个点通常是起点）
         // 这里简单处理：如果fullPath第一个点和p1距离很远，可能需要补p1，
         // 但通常 segmentPath[0] 就是 p1。
         // 这种拼接方式下，第一段完整加入，后续段去头加入，逻辑是闭环的。
         // 唯独第一段：
         const firstSegment = await fetchAStarPath(wps[0], wps[1])
         if (firstSegment) {
            // 重置 fullPath 逻辑更安全：
            fullPath = [...firstSegment]
         } else {
            fullPath = [wps[0], wps[1]]
         }

         // 继续后续段
         for (let i = 1; i < wps.length - 1; i++) {
            const seg = await fetchAStarPath(wps[i], wps[i+1])
            if (seg) {
               seg.shift()
               fullPath = fullPath.concat(seg)
            } else {
               fullPath.push(wps[i+1])
            }
         }
      }

      return {
        ...baseRoute,
        detailedPath: fullPath // 将详细路径存入新字段
      }
    }
    // 生成航迹
 // --- 主函数：生成航迹 (包含两阶段规划) ---
    const generateRoute = async () => {
      // 1. 基础校验
      if (!taskData.value.start_point || !taskData.value.end_point) {
        $q.notify({ type: 'warning', message: '请先设置起点和终点' })
        return
      }

      if (!taskData.value.start_point.lat || !taskData.value.start_point.lng) {
        $q.notify({ type: 'warning', message: '起点坐标无效，请重新设置' })
        return
      }

      if (!taskData.value.end_point.lat || !taskData.value.end_point.lng) {
        $q.notify({ type: 'warning', message: '终点坐标无效，请重新设置' })
        return
      }

      loading.value = true
      loadingMessage.value = '正在进行顶层任务规划...'

      try {
        // 2. 构造顶层规划请求数据 (TSP/VRP)
        const requestData = {
          start_point: {
            latitude: parseFloat(taskData.value.start_point.lat),
            longitude: parseFloat(taskData.value.start_point.lng),
            name: taskData.value.start_point.name || '起点'
          },
          end_point: {
            latitude: parseFloat(taskData.value.end_point.lat),
            longitude: parseFloat(taskData.value.end_point.lng),
            name: taskData.value.end_point.name || '终点'
          },
          number_uavs: parseInt(taskData.value.num_uavs) || 1,
          mission_type: taskData.value.mission_type || 'patrol',
          // 传递禁飞区给顶层规划 (用于惩罚代价计算)
          no_fly_zones: noFlyZones.value.map(zone => ({
            center: {
              latitude: parseFloat(zone.center.lat),
              longitude: parseFloat(zone.center.lng)
            },
            radius: parseFloat(zone.radius),
            name: zone.name || '禁飞区'
          })),
          waypoints: waypoints.value.map(wp => ({
            latitude: parseFloat(wp.lat),
            longitude: parseFloat(wp.lng),
            name: wp.name || `航迹点${wp.sequence + 1}`,
            sequence: parseInt(wp.sequence)
          }))
        }

        console.log('发送顶层规划请求:', JSON.stringify(requestData, null, 2))

        // 第一阶段：调用顶层规划接口
        const response = await api.post('/api/route-planning/plan', requestData)
        console.log('顶层规划响应:', response.data)

        const basicRoutes = response.data.routes

        // 3. 第二阶段：A* 避障细化
        loadingMessage.value = '正在计算避障路径 (A*)...'

        // 对每架无人机的路线并行进行 A* 细化
        const refinementTasks = basicRoutes.map(route => refineRouteWithAStar(route))
        const refinedRoutes = await Promise.all(refinementTasks)

        // 更新最终路由数据
        routes.value = refinedRoutes

        // 4. 绘制与动画
        // 注意：drawRoutes 和 animateRoutes 需要修改为优先使用 detailedPath
        drawRoutes(routes.value)
        animateRoutes(routes.value)

        persistMissionSnapshot()
        logMissionEvent(`航迹生成成功，获得 ${routes.value.length} 条避障路线`)

        $q.notify({ type: 'positive', message: '智能航迹规划完成' })
      } catch (error) {
        console.error('生成航迹失败:', error)
        console.error('错误响应:', error.response)

        let errorMessage = '生成航迹失败'
        if (error.response?.status === 404) {
          errorMessage = '规划服务未响应'
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.message) {
          errorMessage = error.message
        }

        logMissionEvent('航迹生成失败: ' + errorMessage)
        $q.notify({
          type: 'negative',
          message: errorMessage,
          timeout: 5000
        })
      } finally {
        loading.value = false
      }
    }


    const routePolylines = ref([])

    const clearDroneAnimations = () => {
      droneMarkers.value.forEach(marker => {
        if (marker.stopMove) {
          marker.stopMove()
        }
        mapInstance.value && mapInstance.value.remove(marker)
      })
      droneMarkers.value = []
    }

    const createOffsetPath = (path, index, total) => {
      if (total <= 1 || path.length < 2) {
        return path
      }
      const start = path[0]
      const next = path[1]
      const dx = next[0] - start[0]
      const dy = next[1] - start[1]
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length === 0) return path
      const perpX = -dy / length
      const perpY = dx / length
      const spacing = 0.00015 // 约等于 15 米
      const offsetFactor = (index - (total - 1) / 2) * spacing

      return path.map(([lng, lat]) => {
        const latOffset = perpY * offsetFactor
        const lngOffset = perpX * offsetFactor / Math.cos(lat * Math.PI / 180)
        return [lng + lngOffset, lat + latOffset]
      })
    }

const drawRoutes = (routesData) => {
      routePolylines.value.forEach(polyline => mapInstance.value.remove(polyline))
      routePolylines.value = []
      clearDroneAnimations()

      const colors = ['#1E90FF', '#FF6347', '#32CD32', '#FFD700', '#9370DB']

      routesData.forEach((route, index) => {
        // --- 修改：优先使用 detailedPath ---
        const sourcePoints = route.detailedPath || route.waypoints

        // 提取坐标数组 [lng, lat]
        const basePath = sourcePoints.map(wp => {
          const lng = wp.longitude !== undefined ? wp.longitude : wp.lng
          const lat = wp.latitude !== undefined ? wp.latitude : wp.lat
          return [lng, lat]
        })

        // 2. 计算偏移路径（防止多机路线重叠）
        const offsetPath = createOffsetPath(basePath, index, routesData.length)

        // 3. 绘制路线
        const polyline = new window.AMap.Polyline({
          path: offsetPath,
          strokeColor: colors[index % colors.length],
          strokeWeight: 4,
          strokeOpacity: 0.8,
          showDir: true,
          zIndex: 50
        })

        mapInstance.value.add(polyline)
        routePolylines.value.push(polyline)

        // 4. 添加距离标签
        // 重新计算实际飞行距离 (因为 A* 绕路了，原 total_distance 可能不准)
        let realDistance = 0
        if (route.detailedPath) {
             // 简单的距离累加
             for(let i=0; i<offsetPath.length-1; i++) {
                 realDistance += window.AMap.GeometryUtil.distance(offsetPath[i], offsetPath[i+1])
             }
        } else {
             realDistance = route.total_distance !== undefined ? route.total_distance : (route.distance || 0)
        }

        if (offsetPath.length > 0) {
          const label = new window.AMap.Text({
            text: `UAV ${index + 1}: ${Math.round(realDistance)}m`,
            position: offsetPath[0],
            offset: new window.AMap.Pixel(10, -10),
            style: {
              'background-color': colors[index % colors.length],
              'color': '#fff',
              'padding': '5px 10px',
              'border-radius': '3px',
              'font-size': '12px',
              'border': '1px solid #fff'
            },
            zIndex: 51
          })
          mapInstance.value.add(label)
          routePolylines.value.push(label)
        }
      })

      if (routesData.length > 0) {
        mapInstance.value.setFitView()
      }
    }

    const animateRoutes = (routesData) => {
      clearDroneAnimations()
      if (!mapInstance.value || !window.AMap) return

      routesData.forEach((route, index) => {
        // --- 修改：优先使用 detailedPath ---
        const sourcePoints = route.detailedPath || route.waypoints

        const path = sourcePoints.map(wp => {
          const lng = wp.longitude !== undefined ? wp.longitude : wp.lng
          const lat = wp.latitude !== undefined ? wp.latitude : wp.lat
          return new window.AMap.LngLat(lng, lat)
        })

        // 应用偏移 (动画路径也需要偏移，否则会和线不重合)
        // 注意：createOffsetPath 返回的是数组数组 [[lng, lat], ...]，需要转回 LngLat
        // 为了简化，这里我们重新调用 createOffsetPath
        const rawPathArr = path.map(p => [p.getLng(), p.getLat()])
        const offsetPathArr = createOffsetPath(rawPathArr, index, routesData.length)
        const finalPath = offsetPathArr.map(p => new window.AMap.LngLat(p[0], p[1]))

        if (finalPath.length < 2) return

        const marker = new window.AMap.Marker({
          position: finalPath[0],
          icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png',
          offset: new window.AMap.Pixel(-13, -26),
          map: mapInstance.value,
          zIndex: 60
        })

        droneMarkers.value.push(marker)

        // 估算距离用于计算时间
        let dist = 0
        if (route.detailedPath) {
             for(let i=0; i<finalPath.length-1; i++) {
                 dist += finalPath[i].distance(finalPath[i+1])
             }
        } else {
             dist = route.total_distance || 0
        }

        const speed = missionForm.speed || 10
        const duration = Math.max(2000, (dist / speed) * 1000)

        marker.moveAlong(finalPath, {
          duration: duration,
          autoRotation: true
        })
      })
    }
    const resetScene = () => {
      routePolylines.value.forEach(polyline => mapInstance.value.remove(polyline))
      routePolylines.value = []
      clearDroneAnimations()
      waypoints.value.forEach(wp => wp.marker && mapInstance.value.remove(wp.marker))
      noFlyZones.value.forEach(zone => zone.circle && mapInstance.value.remove(zone.circle))
      waypoints.value = []
      noFlyZones.value = []
      routes.value = []
      taskData.value.waypoints = []
      editMode.value = null
      selectionMode.value = null
      persistMissionSnapshot()
      logMissionEvent('场景已重置，请重新规划')
    }

    // 保存配置
    const saveConfiguration = async () => {
      if (!hasRoutes.value) {
        $q.notify({ type: 'warning', message: '请先生成航迹' })
        return
      }

      loading.value = true
      loadingMessage.value = '正在保存配置...'

      try {
        const requestData = {
          name: taskData.value.name || '未命名任务',
          start_point: {
            lat: taskData.value.start_point?.lat || (waypoints.value.length > 0 ? waypoints.value[0].lat : 0),
            lng: taskData.value.start_point?.lng || (waypoints.value.length > 0 ? waypoints.value[0].lng : 0),
            name: taskData.value.start_point?.name || '起点'
          },
          end_point: {
            lat: taskData.value.end_point?.lat || (waypoints.value.length > 0 ? waypoints.value[waypoints.value.length - 1].lat : 0),
            lng: taskData.value.end_point?.lng || (waypoints.value.length > 0 ? waypoints.value[waypoints.value.length - 1].lng : 0),
            name: taskData.value.end_point?.name || '终点'
          },
          num_uavs: taskData.value.num_uavs || 1,
          mission_type: taskData.value.mission_type || 'patrol',
          no_fly_zones: noFlyZones.value.map(zone => ({
            center: zone.center,
            radius: zone.radius,
            name: zone.name
          })),
          waypoints: waypoints.value.map(wp => ({
            lat: wp.lat,
            lng: wp.lng,
            name: wp.name,
            sequence: wp.sequence
          })),
          routes: routes.value
        }

        const response = await missionStore.saveMissionToDatabase(requestData)

        $q.notify({
          type: 'positive',
          message: '配置保存成功',
          actions: [
            { label: '返回任务规划', color: 'white', handler: () => {
              router.push('/mission/ai-task-planning')
            }},
            { label: '查看详情', color: 'white', handler: () => {
              router.push(`/mission/detail/${response.mission_id}`)
            }}
          ]
        })
      } catch (error) {
        console.error('保存配置失败:', error)
        $q.notify({ type: 'negative', message: '保存配置失败: ' + (error.response?.data?.detail || error.message) })
      } finally {
        loading.value = false
      }
    }

    // 导出配置
    const exportConfiguration = () => {
      const config = {
        name: taskData.value.name || '未命名任务',
        start_point: taskData.value.start_point,
        end_point: taskData.value.end_point,
        num_uavs: taskData.value.num_uavs,
        mission_type: taskData.value.mission_type,
        no_fly_zones: noFlyZones.value.map(zone => ({
          center: zone.center,
          radius: zone.radius,
          name: zone.name
        })),
        waypoints: waypoints.value.map(wp => ({
          lat: wp.lat,
          lng: wp.lng,
          name: wp.name,
          sequence: wp.sequence
        })),
        routes: routes.value
      }

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mission_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      $q.notify({ type: 'positive', message: '配置已导出' })
    }

    // 其他辅助函数
    const startAddNoFlyZone = () => { editMode.value = 'nofly-zone' }
    const startAddWaypoint = () => { editMode.value = 'waypoint' }
    const startEditStart = () => { editMode.value = 'start' }
    const startEditEnd = () => { editMode.value = 'end' }
    const cancelEdit = () => { editMode.value = null }
    const selectItem = (item) => { selectedItem.value = item }

    const updateNoFlyZone = (id, updates) => {
      const zone = noFlyZones.value.find(z => z.id === id)
      if (zone) {
        Object.assign(zone, updates)
        if (updates.radius) zone.circle.setRadius(updates.radius)
        persistMissionSnapshot()
      }
    }

    const deleteNoFlyZone = (id) => {
      const index = noFlyZones.value.findIndex(z => z.id === id)
      if (index !== -1) {
        mapInstance.value.remove(noFlyZones.value[index].circle)
        noFlyZones.value.splice(index, 1)
        $q.notify({ type: 'positive', message: '禁飞区已删除' })
        logMissionEvent('已删除一个禁飞区')
        persistMissionSnapshot()
      }
    }

    const updateWaypoint = (id, updates) => {
      const wp = waypoints.value.find(w => w.id === id)
      if (wp) {
        Object.assign(wp, updates)
        persistMissionSnapshot()
      }
    }

    const deleteWaypoint = (id) => {
      const index = waypoints.value.findIndex(w => w.id === id)
      if (index !== -1) {
        mapInstance.value.remove(waypoints.value[index].marker)
        waypoints.value.splice(index, 1)
        // 重新排序和更新标题
        waypoints.value.forEach((wp, i) => {
          wp.sequence = i
          wp.name = `必经点${i + 1}`
          wp.marker.setTitle(`必经点${i + 1}`)
        })
        $q.notify({ type: 'positive', message: '必经点已删除' })
        logMissionEvent('已删除一个必经点')
        persistMissionSnapshot()
      }
    }

    const goBack = () => {
      // 如果是从任务规划页面跳转过来的，保存更新的任务数据到 store
      if (route.query.fromPlanning === 'true' && taskData.value) {
        const updatedMission = {
          ...missionStore.currentMission,
          startPoint: taskData.value.start_point?.name || taskData.value.start_point,
          targetPoint: taskData.value.end_point?.name || taskData.value.end_point,
          droneCount: taskData.value.num_uavs,
          noFlyZones: noFlyZones.value.map(zone => ({
            center: zone.center,
            radius: zone.radius,
            name: zone.name
          })),
          waypoints: waypoints.value.map(wp => ({
            lat: wp.lat,
            lng: wp.lng,
            name: wp.name,
            sequence: wp.sequence
          })),
          routes: routes.value
        }
        missionStore.setCurrentMission(updatedMission)
      }
      router.back()
    }

    // 等待高德地图 API 加载
    const waitForAMap = () => {
      return new Promise((resolve) => {
        if (window.AMap) {
          console.log('高德地图 API 已加载')
          resolve()
        } else {
          console.log('等待高德地图 API 加载...')
          let checkCount = 0
          const checkInterval = setInterval(() => {
            checkCount++
            if (window.AMap) {
              console.log('高德地图 API 加载完成')
              clearInterval(checkInterval)
              resolve()
            } else if (checkCount > 50) {
              // 等待 5 秒后超时
              console.error('高德地图 API 加载超时')
              clearInterval(checkInterval)
              $q.notify({
                type: 'negative',
                message: '高德地图加载超时，请刷新页面重试',
                position: 'top'
              })
              resolve() // 即使超时也 resolve，避免卡住
            }
          }, 100)
        }
      })
    }

    // 生命周期
    onMounted(async () => {
      console.log('组件已挂载')

      missionStore.loadFromLocalStorage()

      if (missionStore.currentMission) {
        taskData.value = {
          name: missionStore.currentMission.taskName || missionStore.currentMission.taskType || '未命名任务',
          num_uavs: missionStore.currentMission.droneCount || 1,
          mission_type: getMissionType(missionStore.currentMission.taskType),
          start_point: extractStartPoint(missionStore.currentMission),
          end_point: extractEndPoint(missionStore.currentMission),
          waypoints: missionStore.currentMission.waypoints || [],
          no_fly_zones: missionStore.currentMission.noFlyZones || []
        }
      } else {
        const taskDataStr = route.query.taskData || localStorage.getItem('currentTaskData')
        if (taskDataStr) {
          try {
            taskData.value = JSON.parse(taskDataStr)
          } catch (e) {
            console.error('解析任务数据失败:', e)
            taskData.value = { num_uavs: 1, mission_type: 'patrol', waypoints: [] }
          }
        } else {
          taskData.value = { num_uavs: 1, mission_type: 'patrol', waypoints: [] }
        }
      }

      missionForm.droneCount = taskData.value.num_uavs || missionForm.droneCount
      missionForm.missionType = taskData.value.mission_type || missionForm.missionType

      await nextTick()
      await waitForAMap()
      initMap()
      await loadCampusPoints()

      setTimeout(() => {
        loadWaypointsFromTask()
        loadNoFlyZonesFromTask()
        if (taskData.value.start_point?.lng && taskData.value.start_point?.lat) {
          updateStartPoint(taskData.value.start_point.lng, taskData.value.start_point.lat, { silent: true })
        }
        if (taskData.value.end_point?.lng && taskData.value.end_point?.lat) {
          updateEndPoint(taskData.value.end_point.lng, taskData.value.end_point.lat, { silent: true })
        }
      }, 600)
    })

    // 辅助函数：提取起点
    const extractStartPoint = (task) => {
      // 如果有 waypoints，使用第一个航迹点作为起点
      if (task.waypoints && task.waypoints.length > 0) {
        const firstWaypoint = task.waypoints[0]
        return {
          lat: firstWaypoint.lat,
          lng: firstWaypoint.lng,
          name: firstWaypoint.name || '起点'
        }
      }

      // 否则尝试从其他字段提取（只有名称，没有坐标）
      if (task.startPoint) {
        return { name: task.startPoint }
      }
      if (task.route?.from) {
        return { name: task.route.from }
      }
      if (task.route?.startPoint) {
        return { name: task.route.startPoint }
      }
      return null
    }

    // 辅助函数：提取终点
    const extractEndPoint = (task) => {
      // 如果有 waypoints，使用最后一个航迹点作为终点
      if (task.waypoints && task.waypoints.length > 0) {
        const lastWaypoint = task.waypoints[task.waypoints.length - 1]
        return {
          lat: lastWaypoint.lat,
          lng: lastWaypoint.lng,
          name: lastWaypoint.name || '终点'
        }
      }

      // 否则尝试从其他字段提取（只有名称，没有坐标）
      if (task.targetPoint) {
        return { name: task.targetPoint }
      }
      if (task.destination) {
        return { name: task.destination }
      }
      if (task.route?.to) {
        return { name: task.route.to }
      }
      if (task.route?.destination) {
        return { name: task.route.destination }
      }
      return null
    }

    // 辅助函数：转换任务类型
    const getMissionType = (taskType) => {
      const typeMap = {
        '巡逻任务': 'patrol',
        '侦察任务': 'patrol',
        '运输任务': 'delivery',
        '配送任务': 'delivery',
        '搜索救援任务': 'inspection',
        '巡检任务': 'inspection',
        '编队表演任务': 'patrol'
      }
      return typeMap[taskType] || 'patrol'
    }

    onBeforeUnmount(() => {
      clearCampusPointOverlays()
      clearPresetNoFlyZones()
      clearDroneAnimations()
      if (mapInstance.value) {
        mapInstance.value.destroy()
      }
    })

    return {
      mapContainer,
      mapInstance,
      taskData,
      editMode,
      loading,
      loadingMessage,
      noFlyZones,
      waypoints,
      routes,
      selectedItem,
      hasRoutes,
      missionForm,
      missionLog,
      missionTypeOptions,
      campusPointOptions,
      campusPointsLoading,
      canPlanMission,
      selectionMode,
      planningPanelOpen,
      focusOnSelection,
      editModeLabel,
      beginMapSelection,
      planMission,
      resetScene,
      loadPresetNoFlyZones,
      startAddNoFlyZone,
      startAddWaypoint,
      startEditStart,
      startEditEnd,
      generateRoute,
      cancelEdit,
      selectItem,
      updateNoFlyZone,
      deleteNoFlyZone,
      updateWaypoint,
      deleteWaypoint,
      saveConfiguration,
      exportConfiguration,
      goBack
    }
  }
}
</script>


<style scoped lang="scss">
.scene-setup-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 100;
  position: relative;
}

.toolbar-title {
  font-size: 18px;
  font-weight: 500;
  margin-left: 16px;
}

.content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.map-container {
  flex: 1;
  position: relative;
  z-index: 1;
}

#amap-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
}

.loading-text {
  font-size: 16px;
  color: #666;
}

.planning-overlay {
  position: absolute;
  top: 96px;
  left: 16px;
  z-index: 20;
  pointer-events: none;
}

.overlay-container {
  pointer-events: auto;
  max-width: min(560px, 62vw);
  background: rgba(15, 23, 42, 0.68);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 22px 45px rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(18px);
}

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.overlay-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: #e2e8f0;
}

.overlay-columns {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(220px, 260px);
  gap: 12px;
}

.overlay-panel {
  background: rgba(15, 23, 42, 0.65);
  color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.32);
}

.primary-panel {
  border-color: rgba(59, 130, 246, 0.45);
}

.log-panel {
  border-color: rgba(148, 163, 184, 0.25);
}

.overlay-floaters {
  position: absolute;
  top: 96px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 18;
  pointer-events: none;
}

.overlay-toggle {
  pointer-events: auto;
}

.overlay-toggle .q-btn {
  border-radius: 999px;
  padding: 0 18px;
  box-shadow: 0 14px 28px rgba(59, 130, 246, 0.35);
}

.selection-pill,
.edit-pill {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  line-height: 1.2;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.65);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.35);
}

.selection-pill {
  border: 1px solid rgba(96, 165, 250, 0.45);
}

.edit-pill {
  border: 1px solid rgba(249, 115, 22, 0.45);
}

.overlay-slide-enter-active,
.overlay-slide-leave-active {
  transition: all 0.2s ease;
}

.overlay-slide-enter-from,
.overlay-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 6px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: rgba(226, 232, 240, 0.9);
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.append-actions {
  display: flex;
  gap: 6px;
}

.append-actions .q-btn {
  color: #e2e8f0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.panel-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.panel-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-actions .q-btn {
  flex: 1 1 48%;
}

.log-scroll {
  height: 180px;
}

.log-entry {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.log-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.log-text {
  font-size: 13px;
  line-height: 1.3;
}

.log-empty {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 12px 0;
}

.selection-banner {
  display: flex;
  align-items: center;
  margin: 10px 0;
  padding: 9px 12px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px dashed rgba(125, 211, 252, 0.4);
  border-radius: 12px;
  font-size: 13px;
  color: #dbeafe;
}

.legend-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.edit-indicator {
  position: absolute;
  bottom: -40px;
  left: 0;
}

@media (max-width: 1200px) {
  .overlay-container {
    max-width: min(420px, 80vw);
  }
  .overlay-columns {
    grid-template-columns: 1fr;
  }
  .panel-actions .q-btn {
    flex: 1 1 100%;
  }
}
</style>

