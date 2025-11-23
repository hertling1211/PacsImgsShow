<template>
  <div class="container">
    <!-- 自定义关闭按钮 -->
    <div class="custom-title">
      <div class="Window-menu"></div>
      <div class="Window-operation">
        <el-button class="Minimize" @click="handleWindowOperation('minimize')">-</el-button>
        <el-button class="close-icon" @click="handleWindowOperation('close')">×</el-button>
      </div>
    </div>
    <!-- 路由出口 -->
    <router-view />
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    handleWindowOperation(operation) {
      if (operation === 'minimize') {
        console.log('用户点击了最小化按钮 (-)')
        // 调用主进程的最小化窗口方法
        window.api.minimizeWindow()
      } else if (operation === 'close') {
        console.log('用户点击了关闭按钮 (×)')
        // 调用主进程的关闭窗口方法
        window.api.closeWindow()
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.custom-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.Window-operation .el-button {
  margin: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  border-radius: 0 !important;
}
.custom-title .Minimize {
  font-size: 16px;
  border: none;
}
.custom-title .Minimize:hover {
  background-color: #4caf50;
  color: aliceblue;
}
.custom-title .close-icon {
  font-size: 16px;
  border: none;
}
.custom-title .close-icon:hover {
  background-color: red;
  color: aliceblue;
}
</style>
