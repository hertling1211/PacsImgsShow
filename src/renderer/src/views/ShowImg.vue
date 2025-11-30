<template>
  <!-- 只负责接收传递来的文件的路径，并根据文件路径找到这个文件，
     解析这个文件，将文件内容显示在页面上。同时提示是不是所有的DCM文件都用这个软件显示，如果选择是的话就将DCM的图标更换成这个软件的logo -->
  <!-- 添加一个返回按钮，点击返回按钮后，返回上一页 -->
  <el-button type="primary" @click="handleBack">返回</el-button>
  <div>
    <img v-if="imgPath" :src="imgPath" alt="PACS 图片" />
    <div v-else>加载中...</div>
  </div>
</template>
<script>
export default {
  name: 'ShowImg',
  data() {
    return {
      imgPath: null
    }
  },
  mounted() {
    // 挂载完成后，根据传递来的文件路径加载图片
    // this.loadImg()
  },
  methods: {
    // 处理返回按钮点击事件
    handleBack() {
      // 返回首页
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
img {
  max-width: 100%;
  max-height: 100%;
}
</style>
