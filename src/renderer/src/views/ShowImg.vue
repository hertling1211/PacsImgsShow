<template>
  <!-- DICOM 查看器主容器 -->
  <div class="dicom-viewer-container">
    <!-- 头部控制栏 -->
    <div class="viewer-header">
      <!-- 返回按钮 -->
      <el-button type="primary" @click="handleBack">返回</el-button>

      <!-- 图像信息显示区域 -->
      <div v-if="imageInfo" class="viewer-info">
        <!-- 患者信息 -->
        <span>患者: {{ imageInfo.patientName }}</span>
        <!-- 系列描述 -->
        <span>系列: {{ imageInfo.seriesDescription }}</span>
        <!-- 图像尺寸 -->
        <span>尺寸: {{ imageInfo.dimensions }}</span>
        <!-- 窗宽窗位设置 -->
        <span>窗宽/窗位: {{ imageInfo.windowWidth }} / {{ imageInfo.windowCenter }}</span>
        <!-- 多图系列时显示当前图像位置 -->
        <span v-if="seriesData.length > 1"
          >当前: {{ currentImageIndex + 1 }}/{{ seriesData.length }}</span
        >
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div v-if="renderer" class="control-panel">
        <!-- 图像系列列表（多图时才显示） -->
        <div v-if="seriesData && seriesData.length > 1" class="series-list-container">
          <el-card class="series-list-card" shadow="never">
            <template #header>
              <div class="control-header">
                <span>图像系列 ({{ seriesData.length }}张)</span>
              </div>
            </template>
            <!-- 系列列表 -->
            <div class="series-list">
              <!-- 遍历显示每个图像 -->
              <div
                v-for="(item, index) in seriesData"
                :key="index"
                :class="['series-list-item', { active: currentImageIndex === index }]"
                @click="switchImage(index)"
              >
                <!-- 图像图标 -->
                <div class="series-icon">
                  <span class="icon-text">📷</span>
                </div>
                <!-- 图像信息 -->
                <div class="series-info">
                  <div class="series-name">图像 {{ index + 1 }}</div>
                  <!-- 简化的系列描述 -->
                  <div v-if="item.seriesDescription" class="series-desc">
                    {{ getShortDescription(item.seriesDescription) }}
                  </div>
                </div>
                <!-- 序号角标 -->
                <div class="series-badge">{{ index + 1 }}</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 像素信息显示 -->
        <el-card v-if="pixelInfo" class="pixel-info-card" shadow="never">
          <template #header>
            <div class="control-header">
              <span>像素信息</span>
            </div>
          </template>
          <!-- 像素详细信息 -->
          <div class="pixel-info">
            <div>坐标: ({{ pixelInfo.x }}, {{ pixelInfo.y }})</div>
            <div>像素值: {{ pixelInfo.value }}</div>
            <div>显示值: {{ pixelInfo.displayValue }}</div>
            <div>HU值: {{ pixelInfo.huValue }}</div>
          </div>
        </el-card>

        <!-- 操作按钮区域 -->
        <el-card class="action-card" shadow="never">
          <template #header>
            <div class="control-header">
              <span>操作</span>
            </div>
          </template>
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <!-- 导出当前图像 -->
            <el-button type="success" size="small" @click="exportImage"> 导出图片 </el-button>
            <!-- 重置缩放 -->
            <el-button size="small" @click="resetZoom"> 重置缩放 </el-button>
          </div>
        </el-card>
      </div>

      <!-- 图像显示区域 -->
      <div class="image-container">
        <!-- Canvas 包装容器 -->
        <div ref="canvasWrapper" class="canvas-wrapper">
          <!-- 主 Canvas 元素，用于渲染 DICOM 图像 -->
          <canvas
            ref="dicomCanvas"
            @mousemove="handleMouseMove"
            @mouseleave="clearPixelInfo"
            @wheel="handleWheel"
            @click="handleClick"
          >
          </canvas>

          <!-- 加载状态遮罩 -->
          <div v-if="loading" class="loading-overlay">
            <div>加载中...</div>
          </div>

          <!-- 错误提示遮罩 -->
          <div v-if="error" class="error-overlay">
            <div>{{ error }}</div>
            <!-- 重试按钮 -->
            <el-button size="small" @click="retryLoad">重试</el-button>
          </div>
        </div>

        <!-- 缩放控制按钮 -->
        <div class="zoom-controls">
          <!-- 按钮组：缩小、显示比例、放大 -->
          <el-button-group size="small">
            <el-button icon="el-icon-zoom-out" @click="zoomOut"></el-button>
            <el-button @click="resetZoom">{{ zoomPercent }}%</el-button>
            <el-button icon="el-icon-zoom-in" @click="zoomIn"></el-button>
          </el-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShowImg', // 组件名称

  // 数据定义
  data() {
    return {
      // 状态数据
      loading: false, // 加载状态
      error: null, // 错误信息
      renderer: null, // DICOM 渲染器实例
      imageInfo: null, // 当前图像信息
      pixelInfo: null, // 鼠标悬停像素信息
      seriesData: [], // 系列数据数组（多图系列）
      currentImageIndex: 0, // 当前显示图像的索引

      // 图像处理参数
      windowWidth: 2048, // 窗宽（用于调节图像对比度）
      windowCenter: 1024, // 窗位（用于调节图像亮度）
      invert: false, // 是否反色
      interpolation: true, // 是否启用插值（平滑显示）
      zoomPercent: 100, // 当前缩放百分比

      // 参数范围限制（防止用户输入极端值）
      minWindowWidth: 10,
      maxWindowWidth: 4096,
      minWindowCenter: -1024,
      maxWindowCenter: 4096
    }
  },

  // 生命周期钩子：组件挂载后执行
  mounted() {
    // 加载 DICOM 数据
    this.loadDicomData()

    // 监听窗口大小变化事件，用于响应式调整 Canvas 大小
    window.addEventListener('resize', this.handleResize)
  },

  // 生命周期钩子：组件销毁前执行
  beforeUnmount() {
    // 清理渲染器，释放资源
    if (this.renderer) {
      this.renderer.destroy()
    }

    // 移除窗口大小变化监听器，防止内存泄漏
    window.removeEventListener('resize', this.handleResize)
  },

  // 方法定义
  methods: {
    // 获取 Canvas 相关的 DOM 元素引用
    getCanvasElements() {
      return {
        dicomCanvas: this.$refs.dicomCanvas, // DICOM 图像的 Canvas 元素
        canvasWrapper: this.$refs.canvasWrapper // Canvas 包装容器
      }
    },

    // 获取 DICOM 数据（支持多种数据来源）
    async getDicomData() {
      // 方式1: 从路由查询参数获取文件路径
      if (this.$route.query) {
        const { type, filePath, filePaths, sessionId } = this.$route.query

        // 处理单个文件
        if (type === 'file' && filePath) {
          // 调用全局的 DCM 文件加载方法
          const data = await this.$LoadImg.DCMFileLoad(filePath)
          return data ? [data] : null
        }
        // 处理文件夹（使用 session 存储）
        else if (type === 'folder' && sessionId) {
          try {
            // 从本地存储获取文件路径列表
            const storedPaths = localStorage.getItem(sessionId)
            const expiry = localStorage.getItem(sessionId + '_expiry')

            // 检查会话是否过期（24小时有效期）
            if (!storedPaths || !expiry || Date.now() > parseInt(expiry)) {
              // 清理过期的 session 数据
              localStorage.removeItem(sessionId)
              localStorage.removeItem(sessionId + '_expiry')
              throw new Error('会话已过期，请重新选择文件夹')
            }

            // 解析存储的文件路径
            const paths = JSON.parse(storedPaths)
            // 加载所有 DICOM 文件
            const data = await this.$LoadImg.DCMFileLoad(paths)

            // 使用后清理 session 数据（一次性使用）
            localStorage.removeItem(sessionId)
            localStorage.removeItem(sessionId + '_expiry')

            return data || null
          } catch (e) {
            console.error('从本地存储获取文件路径失败:', e)
            // 清理无效的 session 数据
            localStorage.removeItem(sessionId)
            localStorage.removeItem(sessionId + '_expiry')
            return null
          }
        }
        // 兼容旧版本：直接使用 filePaths 参数
        else if (type === 'folder' && filePaths) {
          try {
            const paths = JSON.parse(filePaths)
            const data = await this.$LoadImg.DCMFileLoad(paths)
            return data || null
          } catch (e) {
            console.error('解析文件路径失败:', e)
            return null
          }
        }
      }

      // 方式2: 从 props 获取（如果父组件传递了数据）
      if (this.seriesDataProp) {
        return this.seriesDataProp
      }

      // 方式3: 从路由参数获取（兼容旧版本路由传参）
      if (this.$route.params && this.$route.params.seriesData) {
        try {
          return JSON.parse(this.$route.params.seriesData)
        } catch (e) {
          console.error('解析路由参数失败:', e)
        }
      }

      // 方式4: 从 Vuex store 全局状态获取
      if (this.$store && this.$store.state.dicomData) {
        return this.$store.state.dicomData
      }

      // 没有找到数据源
      return null
    },

    // 加载 DICOM 数据的主方法
    async loadDicomData() {
      // 设置加载状态
      this.loading = true
      this.error = null

      try {
        // 获取 DICOM 数据
        const data = await this.getDicomData()

        // 数据验证
        if (!data) {
          throw new Error('未找到 DICOM 数据')
        }

        // 统一处理为数组格式
        if (Array.isArray(data)) {
          this.seriesData = data
        } else {
          this.seriesData = [data]
        }

        // 检查数据是否为空
        if (this.seriesData.length === 0) {
          throw new Error('无法加载 DICOM 数据')
        }

        // 初始化渲染器，显示第一张图像
        await this.initRenderer(this.seriesData[0])
      } catch (err) {
        // 错误处理
        console.error('加载 DICOM 数据失败:', err)
        this.error = err.message || '加载 DICOM 数据失败'
        // 显示错误提示
        this.$message.error('加载 DICOM 数据失败: ' + err.message)
      } finally {
        // 无论成功失败，都结束加载状态
        this.loading = false
      }
    },

    // 初始化 DICOM 渲染器
    async initRenderer(dicomData) {
      // 获取 Canvas 元素
      const { dicomCanvas, canvasWrapper } = this.getCanvasElements()

      // 元素验证
      if (!dicomCanvas || !canvasWrapper || !dicomData) {
        this.error = 'Canvas 元素或 DICOM 数据不可用'
        return
      }

      // 设置加载状态
      this.loading = true
      this.error = null

      try {
        // 清理旧的渲染器实例
        if (this.renderer) {
          this.renderer.destroy()
        }

        // 获取容器尺寸
        const containerWidth = canvasWrapper.clientWidth
        const containerHeight = canvasWrapper.clientHeight

        // 创建新的渲染器实例
        // 假设 this.$DICOMRenderer 是全局注册的 DICOM 渲染器类
        this.renderer = new this.$DICOMRenderer(
          dicomCanvas, // Canvas 元素
          dicomData, // DICOM 数据
          containerWidth, // 容器宽度
          containerHeight, // 容器高度
          {
            // 渲染配置参数
            windowWidth: this.windowWidth,
            windowCenter: this.windowCenter,
            invert: this.invert,
            interpolation: this.interpolation
          }
        )

        // 执行渲染
        const success = await this.renderer.render()

        // 渲染成功后的处理
        if (success) {
          // 获取并更新图像信息
          this.imageInfo = this.renderer.getImageInfo()
          // 更新缩放比例显示
          this.zoomPercent = Math.round(this.renderer.scaleFactor * 100)
        } else {
          throw new Error('渲染失败')
        }
      } catch (err) {
        // 错误处理
        console.error('初始化渲染器失败:', err)
        this.error = err.message || '加载图像失败'
        this.$message.error('加载图像失败: ' + err.message)
      } finally {
        // 结束加载状态
        this.loading = false
      }
    },

    // 截断长描述文本（用于显示缩略信息）
    getShortDescription(description) {
      if (!description) return ''
      if (description.length <= 20) return description
      return description.substring(0, 20) + '...'
    },

    // 处理鼠标移动事件（显示像素信息）
    handleMouseMove(event) {
      if (!this.renderer) return

      const { dicomCanvas } = this.getCanvasElements()
      if (!dicomCanvas) return

      // 获取 Canvas 相对于视口的位置
      const rect = dicomCanvas.getBoundingClientRect()

      // 计算鼠标在 Canvas 上的坐标
      const x = Math.floor(event.clientX - rect.left)
      const y = Math.floor(event.clientY - rect.top)

      // 转换为原始图像坐标（考虑缩放）
      const imageX = Math.floor(x / this.renderer.scaleFactor)
      const imageY = Math.floor(y / this.renderer.scaleFactor)

      // 获取原始像素值
      const pixelValue = this.renderer.getPixelValue(imageX, imageY)

      if (pixelValue !== null) {
        // 获取 DICOM 数据中的重定标参数
        const dicomData = this.renderer.dicomData
        // 计算 HU 值（Hounsfield Unit，用于 CT 图像）
        const huValue = pixelValue * dicomData.rescaleSlope + dicomData.rescaleIntercept

        // 计算显示值（应用窗宽窗位后的值）
        const displayValue = this.renderer.applyWindowLevel(
          pixelValue,
          this.renderer.options.windowWidth,
          this.renderer.options.windowCenter
        )

        // 更新像素信息显示
        this.pixelInfo = {
          x: imageX,
          y: imageY,
          value: pixelValue, // 原始像素值
          displayValue: Math.round(displayValue), // 显示像素值
          huValue: Math.round(huValue) // HU 值
        }
      }
    },

    // 清空像素信息（鼠标离开 Canvas 时）
    clearPixelInfo() {
      this.pixelInfo = null
    },

    // 处理鼠标滚轮事件
    handleWheel(event) {
      // 阻止默认滚动行为
      event.preventDefault()

      if (!this.renderer) return

      // 检查是否按下 Ctrl 键
      if (event.ctrlKey) {
        // Ctrl + 滚轮：缩放图像
        const delta = event.deltaY > 0 ? -0.1 : 0.1 // 滚轮向下缩小，向上放大
        let newScale = this.renderer.scaleFactor + delta
        // 限制缩放范围（10% - 1000%）
        newScale = Math.max(0.1, Math.min(10, newScale))

        // 计算新的 Canvas 尺寸
        const dicomData = this.renderer.dicomData
        const newWidth = dicomData.columns * newScale
        const newHeight = dicomData.rows * newScale

        // 调整渲染器尺寸并重新渲染
        this.renderer.resize(newWidth, newHeight)
        this.renderer.render().then(() => {
          // 更新缩放百分比显示
          this.zoomPercent = Math.round(newScale * 100)
        })
      } else {
        // 普通滚轮：切换图像（仅当有多张图像时）
        if (this.seriesData.length > 1) {
          const delta = event.deltaY > 0 ? 1 : -1 // 滚轮向下下一张，向上上一张
          let newIndex = this.currentImageIndex + delta

          // 循环切换：到达末尾时回到开头，到达开头时跳到末尾
          if (newIndex < 0) {
            newIndex = this.seriesData.length - 1
          } else if (newIndex >= this.seriesData.length) {
            newIndex = 0
          }

          // 切换到新图像
          this.switchImage(newIndex)
        }
      }
    },

    // 放大图像
    zoomIn() {
      if (!this.renderer) return

      // 放大 1.2 倍
      let newScale = this.renderer.scaleFactor * 1.2
      // 限制最大缩放为 1000%
      newScale = Math.min(10, newScale)

      // 计算新尺寸
      const dicomData = this.renderer.dicomData
      const newWidth = dicomData.columns * newScale
      const newHeight = dicomData.rows * newScale

      // 调整尺寸并重新渲染
      this.renderer.resize(newWidth, newHeight)
      this.renderer.render().then(() => {
        this.zoomPercent = Math.round(newScale * 100)
      })
    },

    // 缩小图像
    zoomOut() {
      if (!this.renderer) return

      // 缩小到原来的 1/1.2
      let newScale = this.renderer.scaleFactor / 1.2
      // 限制最小缩放为 10%
      newScale = Math.max(0.1, newScale)

      // 计算新尺寸
      const dicomData = this.renderer.dicomData
      const newWidth = dicomData.columns * newScale
      const newHeight = dicomData.rows * newScale

      // 调整尺寸并重新渲染
      this.renderer.resize(newWidth, newHeight)
      this.renderer.render().then(() => {
        this.zoomPercent = Math.round(newScale * 100)
      })
    },

    // 重置缩放（自适应容器大小）
    resetZoom() {
      if (!this.renderer) return

      // 获取容器元素
      const { canvasWrapper } = this.getCanvasElements()
      if (!canvasWrapper) return

      // 获取容器尺寸
      const containerWidth = canvasWrapper.clientWidth
      const containerHeight = canvasWrapper.clientHeight
      const dicomData = this.renderer.dicomData

      // 计算自适应缩放比例（保持宽高比）
      const scaleFactor = Math.min(
        containerWidth / dicomData.columns,
        containerHeight / dicomData.rows
      )

      // 调整渲染器尺寸并重新渲染
      this.renderer.resize(dicomData.columns * scaleFactor, dicomData.rows * scaleFactor)
      this.renderer.render().then(() => {
        // 更新缩放百分比
        this.zoomPercent = Math.round(scaleFactor * 100)
      })
    },

    // 导出当前图像为 PNG
    exportImage() {
      if (!this.renderer) return

      try {
        // 从 Canvas 生成 Data URL（PNG 格式，质量 1.0）
        const dataURL = this.renderer.exportToDataURL('image/png', 1.0)

        // 创建临时下载链接
        const link = document.createElement('a')
        link.href = dataURL
        // 设置下载文件名（包含时间戳）
        link.download = `DICOM_${Date.now()}.png`
        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 显示成功提示
        this.$message.success('图像导出成功')
      } catch (err) {
        console.error('导出图像失败:', err)
        this.$message.error('导出图像失败')
      }
    },

    // 切换显示的图像（用于多图系列）
    async switchImage(index) {
      // 如果点击的是当前图像，不做任何操作
      if (index === this.currentImageIndex || !this.seriesData[index]) {
        return
      }

      // 更新当前图像索引
      this.currentImageIndex = index
      // 获取新的 DICOM 数据
      const dicomData = this.seriesData[index]
      // 使用新数据重新初始化渲染器
      await this.initRenderer(dicomData)
    },

    // 处理 Canvas 点击事件（预留功能：测量、标注等）
    handleClick(event) {
      // 这里可以添加标注、测量等功能的实现
      // event.offsetX 和 event.offsetY 提供点击位置
      console.log('Canvas clicked at:', event.offsetX, event.offsetY)
    },

    // 重试加载数据（错误时调用）
    retryLoad() {
      this.error = null
      this.loadDicomData()
    },

    // 处理窗口大小变化事件
    handleResize() {
      // 当窗口大小变化时，重新调整 Canvas 大小
      if (this.renderer) {
        const { canvasWrapper } = this.getCanvasElements()
        if (!canvasWrapper) return

        // 获取新容器尺寸
        const containerWidth = canvasWrapper.clientWidth
        const containerHeight = canvasWrapper.clientHeight
        const dicomData = this.renderer.dicomData

        // 计算自适应缩放比例
        const scaleFactor = Math.min(
          containerWidth / dicomData.columns,
          containerHeight / dicomData.rows
        )

        // 调整渲染器尺寸并重新渲染
        this.renderer.resize(dicomData.columns * scaleFactor, dicomData.rows * scaleFactor)
        this.renderer.render().then(() => {
          this.zoomPercent = Math.round(scaleFactor * 100)
        })
      }
    },

    // 返回上一页
    handleBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
/* 主容器：全屏显示，深色主题 */
.dicom-viewer-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a; /* 深灰背景 */
  color: #fff;
}

/* 头部控制栏样式 */
.viewer-header {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background-color: #2d2d2d; /* 稍亮的深灰 */
  border-bottom: 1px solid #444; /* 分割线 */
}

/* 图像信息显示样式 */
.viewer-info {
  margin-left: 20px;
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #aaa; /* 浅灰色文字 */
  flex-wrap: wrap; /* 允许换行 */
}

/* 信息标签样式 */
.viewer-info span {
  padding: 4px 8px;
  background-color: #3a3a3a; /* 标签背景 */
  border-radius: 4px;
}

/* 主内容区域 */
.main-content {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  overflow: hidden; /* 防止内容溢出 */
}

/* 左侧控制面板 */
.control-panel {
  width: 300px;
  padding: 20px;
  background-color: #2d2d2d;
  border-right: 1px solid #444; /* 右侧分割线 */
  overflow-y: auto; /* 垂直滚动 */
  display: flex;
  flex-direction: column;
  gap: 20px; /* 子元素间距 */
}

/* 系列列表容器 */
.series-list-container {
  flex-shrink: 0; /* 防止压缩 */
}

/* 系列列表卡片 */
.series-list-card {
  background-color: #3a3a3a;
  border: none; /* 移除默认边框 */
}

/* 系列列表 */
.series-list {
  max-height: 400px;
  overflow-y: auto; /* 内容过多时滚动 */
}

/* 系列列表项 */
.series-list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 8px;
  cursor: pointer; /* 鼠标手型 */
  transition: all 0.3s ease; /* 平滑过渡效果 */
  position: relative; /* 用于绝对定位角标 */
}

/* 悬停效果 */
.series-list-item:hover {
  background-color: #3a3a3a;
  border-color: #409eff; /* Element UI 主色 */
  transform: translateY(-2px); /* 轻微上浮 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* 阴影效果 */
}

/* 选中状态 */
.series-list-item.active {
  background-color: #2a3a4a; /* 深蓝色背景 */
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3); /* 蓝色阴影 */
}

/* 系列图标 */
.series-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff, #67c23a); /* 渐变背景 */
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0; /* 防止压缩 */
}

/* 图标文字 */
.series-icon .icon-text {
  font-size: 20px;
  color: white;
}

/* 系列信息区域 */
.series-info {
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 防止内容溢出 */
}

/* 系列名称 */
.series-name {
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  font-size: 14px;
}

/* 系列描述（截断显示） */
.series-desc {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 显示省略号 */
}

/* 序号角标 */
.series-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e6a23c; /* 橙色背景 */
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

/* 像素信息卡片 */
.pixel-info-card {
  background-color: #3a3a3a;
  border: none;
}

/* 像素信息内容 */
.pixel-info {
  font-size: 14px;
  color: #ccc;
}

/* 像素信息行 */
.pixel-info div {
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #444; /* 行分隔线 */
}

/* 操作卡片 */
.action-card {
  background-color: #3a3a3a;
  border: none;
}

/* 操作按钮容器 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 按钮间距 */
}

/* 左对齐按钮 */
.action-buttons .el-button {
  justify-content: flex-start;
}

/* 控制面板头部样式 */
.control-header {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

/* 图像显示区域 */
.image-container {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: relative;
}

/* Canvas 包装容器 */
.canvas-wrapper {
  flex: 1; /* 占据主要空间 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000; /* 黑色背景，适合医学图像 */
  border: 1px solid #444;
  border-radius: 4px;
  position: relative;
  overflow: auto; /* 图片过大时可滚动 */
}

/* Canvas 元素样式 */
canvas {
  display: block; /* 消除行内元素间隙 */
  max-width: 100%; /* 响应式宽度 */
  max-height: 100%; /* 响应式高度 */
  cursor: crosshair; /* 十字光标，适合图像测量 */
}

/* 加载和错误遮罩层 */
.loading-overlay,
.error-overlay {
  position: absolute; /* 覆盖在 Canvas 上 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8); /* 半透明黑色背景 */
  color: #fff;
}

/* 加载图标旋转动画 */
@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 缩放控制区域 */
.zoom-controls {
  margin-top: 10px;
  text-align: center;
}

/* 自定义滚动条样式（WebKit 浏览器） */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background: #2d2d2d;
  border-radius: 4px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

/* 滑块悬停效果 */
::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
