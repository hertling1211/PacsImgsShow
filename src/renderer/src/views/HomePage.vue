<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <!-- 使用assets目录下的SVG文件 -->
      <div class="logo-container">
        <img src="../assets/icon.svg" alt="PacsImgsShow Logo" class="logo-image" />
      </div>

      <!-- 欢迎信息 -->
      <div class="welcome-text">
        <h1 class="app-title">PacsImgsShow</h1>
        <p class="welcome-message">{{ message }}</p>
        <p class="subtitle">专业医学影像查看与管理系统</p>
      </div>

      <!-- 功能按钮区 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" class="action-btn">开始使用</el-button>
        <el-button size="large" class="action-btn">选择影像</el-button>
      </div>
    </div>

    <!-- 装饰性元素 - 增强动画效果 -->
    <div class="decorative-elements">
      <!-- 圆形元素 -->
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>

      <!-- 新增装饰元素 -->
      <div class="ellipse ellipse-1"></div>
      <div class="ellipse ellipse-2"></div>
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
      <div class="dots dots-1"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      message: '欢迎使用医学影像查看系统'
    }
  }
}
</script>

<style scoped>
.welcome-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  position: relative;
  overflow: hidden;
}

.welcome-content {
  text-align: center;
  z-index: 10;
  animation: fadeIn 1s ease-in-out;
}

.logo-container {
  margin-bottom: 30px;
  animation: logoScale 1.5s ease-in-out;
}

.logo-image {
  width: 180px;
  height: 180px;
  filter: drop-shadow(0 4px 8px rgba(0, 200, 179, 0.3));
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.welcome-text {
  margin-bottom: 40px;
}

.app-title {
  font-size: 42px;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 16px;
  animation: slideUp 0.8s ease-out;
}

.welcome-message {
  font-size: 20px;
  color: #334155;
  margin-bottom: 12px;
  animation: slideUp 0.8s ease-out 0.2s both;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  animation: slideUp 0.8s ease-out 0.4s both;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  animation: slideUp 0.8s ease-out 0.6s both;
}

.action-btn {
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.decorative-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
}

/* 圆形元素样式 */
.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 200, 179, 0.1) 0%, rgba(0, 200, 179, 0.05) 100%);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation:
    float 8s ease-in-out infinite,
    rotate 20s linear infinite;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: 10%;
  animation:
    float 10s ease-in-out infinite reverse,
    pulse 6s ease-in-out infinite;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 30%;
  right: -50px;
  animation:
    float 12s ease-in-out infinite,
    rotate 15s linear infinite reverse;
}

/* 新增椭圆元素 */
.ellipse {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 179, 200, 0.1) 0%, rgba(0, 179, 200, 0.05) 100%);
}

.ellipse-1 {
  width: 250px;
  height: 150px;
  top: 20%;
  left: 5%;
  transform: rotate(30deg);
  animation:
    floatHorizontal 15s ease-in-out infinite,
    rotate 25s linear infinite;
}

.ellipse-2 {
  width: 180px;
  height: 100px;
  bottom: 15%;
  left: 15%;
  transform: rotate(-15deg);
  animation:
    floatHorizontal 12s ease-in-out infinite reverse,
    rotate 18s linear infinite reverse;
}

/* 环形元素 */
.ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(0, 200, 179, 0.2);
  background: transparent;
}

.ring-1 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 20%;
  animation:
    expandContract 8s ease-in-out infinite,
    rotate 15s linear infinite;
}

.ring-2 {
  width: 80px;
  height: 80px;
  top: 15%;
  right: 25%;
  border-width: 3px;
  animation:
    expandContract 10s ease-in-out infinite reverse,
    float 15s ease-in-out infinite;
}

/* 点状元素 */
.dots {
  position: absolute;
  background-image: radial-gradient(circle, rgba(0, 200, 179, 0.3) 2px, transparent 2px);
  background-size: 20px 20px;
}

.dots-1 {
  width: 200px;
  height: 200px;
  bottom: 10%;
  right: 30%;
  animation:
    float 18s ease-in-out infinite,
    rotate 30s linear infinite;
}

/* 增强的动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoScale {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 上下浮动动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.8;
  }
  25% {
    transform: translateY(-20px) scale(1.05);
    opacity: 0.6;
  }
  50% {
    transform: translateY(0) scale(1);
    opacity: 0.8;
  }
  75% {
    transform: translateY(20px) scale(0.95);
    opacity: 0.6;
  }
}

/* 水平浮动动画 */
@keyframes floatHorizontal {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
    opacity: 0.7;
  }
  25% {
    transform: translateX(20px) rotate(10deg);
    opacity: 0.5;
  }
  50% {
    transform: translateX(0) rotate(0deg);
    opacity: 0.7;
  }
  75% {
    transform: translateX(-20px) rotate(-10deg);
    opacity: 0.5;
  }
}

/* 旋转动画 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

/* 缩放动画 */
@keyframes expandContract {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  25% {
    transform: scale(1.2);
    opacity: 0.6;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
  75% {
    transform: scale(0.8);
    opacity: 0.6;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-title {
    font-size: 32px;
  }

  .welcome-message {
    font-size: 18px;
  }

  .subtitle {
    font-size: 14px;
  }

  .logo-image {
    width: 150px;
    height: 150px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    width: 200px;
  }

  /* 响应式装饰元素 */
  .circle-1 {
    width: 200px;
    height: 200px;
  }
  .circle-2 {
    width: 150px;
    height: 150px;
  }
  .circle-3 {
    width: 100px;
    height: 100px;
  }
  .ellipse-1 {
    width: 200px;
    height: 100px;
  }
  .ellipse-2 {
    width: 150px;
    height: 80px;
  }
  .ring-1 {
    width: 100px;
    height: 100px;
  }
  .ring-2 {
    width: 60px;
    height: 60px;
  }
  .dots-1 {
    width: 150px;
    height: 150px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 28px;
  }

  .logo-image {
    width: 120px;
    height: 120px;
  }

  /* 更小屏幕的装饰元素调整 */
  .circle-1 {
    width: 150px;
    height: 150px;
  }
  .circle-2 {
    width: 100px;
    height: 100px;
  }
  .circle-3 {
    width: 80px;
    height: 80px;
  }
  .ellipse-1 {
    width: 150px;
    height: 80px;
  }
  .ellipse-2 {
    width: 120px;
    height: 60px;
  }
  .ring-1 {
    width: 80px;
    height: 80px;
  }
  .ring-2 {
    width: 50px;
    height: 50px;
  }
  .dots-1 {
    width: 120px;
    height: 120px;
  }
}
</style>
