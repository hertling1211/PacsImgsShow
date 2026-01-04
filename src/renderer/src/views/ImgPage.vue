<!-- 展示影像图片的页面 -->
<template>
  <div class="dicom-viewer-container">
    <!-- 加载状态遮罩层，加载中时显示 -->
    <div v-if="loading" class="loading-overlay">
      <!-- 加载旋转进度条 -->
      <div class="loading-spinner"></div>
      <!-- 添加一个加载进度百分比 -->
      <div class="loading-progress">{{ loadingProgress }}%</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImgPage',
  data() {
    return {
      // 加载状态，初始为true，加载完成后设为false
      loading: true,
      // 加载进度，初始为0，加载完成后设为100
      loadingProgress: 0
    }
  }
}
</script>
<style>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 9999;
}
.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loading-progress {
  color: #fff;
  font-size: 14px;
  margin-top: 10px;
}
</style>
