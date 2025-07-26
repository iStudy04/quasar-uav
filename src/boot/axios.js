import { boot } from 'quasar/wrappers'
import axios from 'axios'

// 这里我们创建一个没有 baseURL 的实例。
// 在开发模式下，它会请求当前域（例如 http://localhost:9000/api/clients），
// 然后由quasar.config.js中的devServer代理转发。
// 在生产模式下，你需要确保前端和后端在同一个域或已正确配置CORS。
const api = axios.create()

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
