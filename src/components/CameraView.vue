<template>
  <q-card flat class="tech-camera-card">
    <div class="camera-header tech-text">视频图传</div>
    <div class="camera-container">
      <!--
        将 <img> 替换为 <video> 标签
        - `ref="videoPlayer"` 用于在脚本中获取DOM元素
        - `autoplay muted playsinline` 是为了让视频在所有浏览器中都能自动播放
        - `controls` 方便调试，可以根据需要移除
      -->
      <video
        ref="videoPlayer"
        class="tech-camera-feed"
        autoplay
        muted
        playsinline
        controls
      ></video>
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  // ip 属性仍然保留，用于生成流路径
  ip: String,
});

// 创建一个 ref 来引用 <video> 元素
const videoPlayer = ref(null);

// 定义一个变量来持有 WebRTC 连接实例，方便管理
let peerConnection = null;

// 根据传入的 ip 动态计算 mediamtx 中的流路径
const streamPath = computed(() => {
  if (!props.ip) {
    return null;
  }
  // 从 "192.168.1.183" 中提取 "183"
  const lastOctet = props.ip.split(".").pop();
  // 按照约定拼接路径："robot/robot_183"
  return `robot/robot_${lastOctet}`;
});

// 核心函数：启动 WebRTC 连接
const startWebRTCStream = async (path) => {
  if (!path) {
    console.log("Stream path is not defined. Aborting.");
    return;
  }

  // 1. 如果已有连接，先关闭，防止重复连接
  if (peerConnection) {
    peerConnection.close();
  }

  // 2. 创建新的 RTCPeerConnection 实例
  peerConnection = new RTCPeerConnection();

  // 3. 监听 ontrack 事件，当收到视频流时，将其附加到 <video> 元素上
  peerConnection.ontrack = (event) => {
    if (videoPlayer.value) {
      console.log("Received remote stream, attaching to video element.");
      videoPlayer.value.srcObject = event.streams[0];
    }
  };

  // 4. 添加我们想要接收的媒体类型（只接收视频）
  peerConnection.addTransceiver("video", { direction: "recvonly" });
  // 如果您的流有音频，可以取消下面这行的注释
  // peerConnection.addTransceiver('audio', { 'direction': 'recvonly' });

  // 5. 创建 Offer (SDP)
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // 6. 将 Offer 发送给 MediaMTX 的 WHEP API 接口
  // MediaMTX 默认的 WebRTC API 端口是 8889
  const apiUrl = `http://127.0.0.1:8889/${path}/whep`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
      },
      body: peerConnection.localDescription.sdp,
    });

    if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
    }

    // 7. 接收 MediaMTX 返回的 Answer (SDP)
    const answerSdp = await response.text();

    // 8. 设置远程描述，完成握手，连接建立
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: "answer", sdp: answerSdp })
    );
    console.log(`WebRTC connection established for path: ${path}`);

  } catch (error) {
    console.error("Failed to start WebRTC stream:", error);
    // 可以在这里添加一些用户提示，比如在视频区域显示错误信息
  }
};

// 组件挂载时，启动视频流
onMounted(() => {
  console.log("摄像头IP地址为: " + props.ip);
  startWebRTCStream(streamPath.value);
});

// 组件卸载时，清理连接，释放资源
onUnmounted(() => {
  if (peerConnection) {
    console.log("Closing WebRTC connection.");
    peerConnection.close();
    peerConnection = null;
  }
});

// 监听 ip prop 的变化，如果变化了，则重新连接到新的流
watch(() => props.ip, (newIp) => {
    console.log(`IP changed to: ${newIp}. Reconnecting stream...`);
    // streamPath 会自动更新，我们只需要用新路径重新调用函数即可
    startWebRTCStream(streamPath.value);
});

</script>

<style scoped>
/* 您的样式代码保持不变，可以完美复用 */
.tech-camera-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border: 1px solid #4A90E2;
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(74, 144, 226, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  position: relative;
}

.camera-header {
  background: rgba(74, 144, 226, 0.1);
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid rgba(74, 144, 226, 0.3);
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.camera-container {
  position: relative;
  padding: 8px;
}

.tech-camera-feed {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.2);
  background-color: #000; /* 给video标签一个黑色背景，加载时更好看 */
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
