<template>
  <!-- 只负责接收传递来的文件的路径，并根据文件路径找到这个文件，
     解析这个文件，将文件内容显示在页面上。同时提示是不是所有的DCM文件都用这个软件显示，如果选择是的话就将DCM的图标更换成这个软件的logo -->
  <!-- 添加一个返回按钮，点击返回按钮后，返回上一页 -->
  <el-button type="primary" @click="handleBack">返回</el-button>
  <div>
    <!-- 展示this.$LoadImg.handleDicomContent(seriesInfo) -->
    <div>{{ dicomContent }}</div>
    <!-- <img v-if="imgPath" :src="imgPath" alt="PACS 图片" />
    <div v-else>加载中...</div> -->
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
  watch: {
    // 实时获取this.$LoadImg.handleDicomContent(seriesInfo)的返回值
    dicomContent: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.$LoadImg.handleDicomContent(newVal)
        }
      },
      deep: true
    }
  },
  mounted() {},
  methods: {
    // 处理返回按钮点击事件
    handleBack() {
      // 返回首页
      this.$router.push('/')
    },
    // 处理Dicom内容
    handleDicomContent(seriesInfo) {
      console.log('seriesInfo:', seriesInfo)
      if (seriesInfo && seriesInfo.length > 0) {
        // 提取第一张图片的路径
        this.imgPath = seriesInfo[0].imageId
      }
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
