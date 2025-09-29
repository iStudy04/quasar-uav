const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      // 集群管理
      { path: '/cluster/ingress', component: () => import('pages/cluster/IngressPage.vue') },
      { path: '/cluster/auth', component: () => import('pages/cluster/AuthPage.vue') },
      { path: '/cluster/status', component: () => import('pages/cluster/StatusPage.vue') },

      // 单机控制
      { path: '/single/flight', component: () => import('pages/single/FlightControlPage.vue') },
      { path: '/single/avoidance', component: () => import('pages/single/AvoidancePage.vue') },
      { path: '/single/path-planning', component: () => import('pages/single/PathPlanningPage.vue') },
      { path: '/single/vln', component: () => import('pages/single/VisionLanguageNavPage.vue') },
      { path: '/single/voice', component: () => import('pages/single/VoiceControlPage.vue') },

      // 集群控制
      { path: '/swarm/control', component: () => import('pages/swarm/CooperativeControlPage.vue') },
      { path: '/swarm/formation', component: () => import('pages/swarm/FormationPage.vue') },
      { path: '/swarm/avoidance', component: () => import('pages/swarm/CooperativeAvoidancePage.vue') },
      { path: '/swarm/vision-voice', component: () => import('pages/swarm/VisionVoiceNavPage.vue') },
      { path: '/swarm/voice', component: () => import('pages/swarm/VoiceControlPage.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
