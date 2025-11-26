<template>
  <div class="setting-container">
    <div class="setting-content">
      <h1>设置</h1>
      <!-- 这里可以添加您的设置表单内容 -->
      <div class="setting-form">
        <!-- 表单内容 -->
      </div>
    </div>
    <div class="settingSave">
      <el-button type="primary">保存</el-button>
      <el-button type="info">取消</el-button>
      <el-button type="success">应用</el-button>
      <el-button type="danger">恢复默认</el-button>
    </div>
  </div>
</template>

<style>
.setting-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  height: 100%;
}

.setting-content {
  width: 100%;
}

.settingSave {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
