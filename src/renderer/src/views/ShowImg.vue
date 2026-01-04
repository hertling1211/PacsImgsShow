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
          <!-- Element UI 卡片组件，用于包裹系列列表 -->
          <el-card class="series-list-card" shadow="never">
            <!-- 卡片标题插槽 -->
            <template #header>
              <div class="control-header">
                <!-- 显示系列数量 -->
                <span>图像系列 ({{ seriesData.length }}张)</span>
              </div>
            </template>
            <!-- 系列列表内容区域 -->
            <div class="series-list">
              <!-- 遍历显示每个图像，动态绑定类名，当前选中项添加 active 类 -->
              <div
                v-for="(item, index) in seriesData"
                :key="index"
                :class="['series-list-item', { active: currentImageIndex === index }]"
                @click="switchImage(index)"
              >
                <!-- 图像图标区域 -->
                <div class="series-icon">
                  <!-- 使用表情符号作为图像图标 -->
                  <span class="icon-text">📷</span>
                </div>
                <!-- 图像信息区域 -->
                <div class="series-info">
                  <!-- 图像序号 -->
                  <div class="series-name">图像 {{ index + 1 }}</div>
                  <!-- 系列描述，过长时截断显示 -->
                  <div v-if="item.seriesDescription" class="series-desc">
                    {{ getShortDescription(item.seriesDescription) }}
                  </div>
                </div>
                <!-- 序号角标，显示图像序号 -->
                <div class="series-badge">{{ index + 1 }}</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 像素信息显示卡片 -->
        <el-card v-if="pixelInfo" class="pixel-info-card" shadow="never">
          <!-- 卡片标题 -->
          <template #header>
            <div class="control-header">
              <span>像素信息</span>
            </div>
          </template>
          <!-- 像素详细信息内容 -->
          <div class="pixel-info">
            <!-- 鼠标在图像上的坐标 -->
            <div>坐标: ({{ pixelInfo.x }}, {{ pixelInfo.y }})</div>
            <!-- 原始像素值 -->
            <div>像素值: {{ pixelInfo.value }}</div>
            <!-- 应用窗宽窗位后的显示值 -->
            <div>显示值: {{ pixelInfo.displayValue }}</div>
            <!-- Hounsfield 单位值，用于 CT 图像 -->
            <div>HU值: {{ pixelInfo.huValue }}</div>
          </div>
        </el-card>

        <!-- 操作按钮区域卡片 -->
        <el-card class="action-card" shadow="never">
          <!-- 卡片标题 -->
          <template #header>
            <div class="control-header">
              <span>操作</span>
            </div>
          </template>
          <!-- 操作按钮组 -->
          <div class="action-buttons">
            <!-- 导出当前图像按钮 -->
            <el-button type="success" size="small" @click="exportImage"> 导出图片 </el-button>
            <!-- 重置缩放按钮 -->
            <el-button size="small" @click="resetZoom"> 重置缩放 </el-button>
          </div>
        </el-card>
      </div>

      <!-- 图像显示区域 -->
      <div class="image-container">
        <!-- Canvas 包装容器，用于控制 Canvas 的显示和布局 -->
        <div ref="canvasWrapper" class="canvas-wrapper">
          <!-- 主 Canvas 元素，用于渲染 DICOM 图像，绑定多个交互事件 -->
          <!-- 鼠标移动时获取像素信息 -->
          <!-- 鼠标离开时清空像素信息 -->
          <!-- 鼠标滚轮事件，支持缩放和切换图像 -->
          <!-- 点击事件，预留用于测量标注功能 -->
          <canvas
            ref="dicomCanvas"
            @mousemove="handleMouseMove"
            @mouseleave="clearPixelInfo"
            @wheel="handleWheel"
            @click="handleClick"
          >
          </canvas>

          <!-- 加载状态遮罩层，加载中时显示 -->
          <div v-if="loading" class="loading-overlay">
            <div>加载中...</div>
          </div>

          <!-- 错误提示遮罩层，加载失败时显示 -->
          <div v-if="error" class="error-overlay">
            <!-- 错误信息 -->
            <div>{{ error }}</div>
            <!-- 重试按钮 -->
            <el-button size="small" @click="retryLoad">重试</el-button>
          </div>
        </div>

        <!-- 缩放控制按钮组 -->
        <div class="zoom-controls">
          <!-- Element UI 按钮组组件 -->
          <el-button-group size="small">
            <!-- 缩小按钮 -->
            <el-button icon="el-icon-zoom-out" @click="zoomOut"></el-button>
            <!-- 显示当前缩放比例，点击可重置缩放 -->
            <el-button @click="resetZoom">{{ zoomPercent }}%</el-button>
            <!-- 放大按钮 -->
            <el-button icon="el-icon-zoom-in" @click="zoomIn"></el-button>
          </el-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShowImg', // 组件名称，用于 Vue DevTools 调试和组件递归调用

  // 数据定义
  data() {
    return {
      // 状态数据
      loading: false, // 加载状态，控制加载遮罩显示
      error: null, // 错误信息，存储加载或渲染过程中的错误
      renderer: null, // DICOM 渲染器实例，用于操作和渲染 DICOM 图像
      imageInfo: null, // 当前图像信息对象，包含患者信息、图像尺寸等
      pixelInfo: null, // 鼠标悬停像素信息，显示坐标、像素值等
      seriesData: [], // 系列数据数组，存储多图系列中的所有图像数据
      currentImageIndex: 0, // 当前显示图像在 seriesData 中的索引

      // 图像处理参数
      windowWidth: 2048, // 窗宽，控制图像对比度，影响图像显示的灰度范围
      windowCenter: 1024, // 窗位，控制图像亮度，决定图像显示的中心灰度值
      invert: false, // 是否反色显示，将图像颜色反转
      interpolation: true, // 是否启用插值，开启后图像缩放时更平滑
      zoomPercent: 100, // 当前缩放百分比，显示给用户

      // 参数范围限制（防止用户输入极端值）
      minWindowWidth: 10, // 最小窗宽值
      maxWindowWidth: 4096, // 最大窗宽值
      minWindowCenter: -1024, // 最小窗位值（可为负数）
      maxWindowCenter: 4096 // 最大窗位值
    }
  },

  // 生命周期钩子：组件挂载后执行
  mounted() {
    // 组件挂载后立即加载 DICOM 数据
    this.loadDicomData()

    // 监听窗口大小变化事件，当窗口大小改变时调整 Canvas 尺寸
    window.addEventListener('resize', this.handleResize)
  },

  // 生命周期钩子：组件销毁前执行
  beforeUnmount() {
    // 清理渲染器，释放内存和资源，避免内存泄漏
    if (this.renderer) {
      this.renderer.destroy()
    }

    // 移除窗口大小变化监听器，避免组件销毁后仍执行回调
    window.removeEventListener('resize', this.handleResize)
  },

  // 方法定义
  methods: {
    // 获取 Canvas 相关的 DOM 元素引用
    getCanvasElements() {
      return {
        dicomCanvas: this.$refs.dicomCanvas, // DICOM 图像的 Canvas 元素
        canvasWrapper: this.$refs.canvasWrapper // Canvas 包装容器，用于获取容器尺寸
      }
    },

    // 获取 DICOM 数据（支持多种数据来源）
    async getDicomData() {
      // 方式1: 从路由查询参数获取文件路径（最常用的方式）
      if (this.$route.query) {
        // 解构路由查询参数
        const { type, filePath, filePaths, sessionId } = this.$route.query

        // 处理单个文件情况
        if (type === 'file' && filePath) {
          // 调用全局的 DCM 文件加载方法，加载单个 DICOM 文件
          const data = await this.$LoadImg.DCMFileLoad(filePath)
          // 返回数组格式，保持数据格式统一
          return data ? [data] : null
        }
        // 处理文件夹情况（使用 session 存储临时数据）
        else if (type === 'folder' && sessionId) {
          try {
            // 从本地存储获取文件路径列表
            const storedPaths = localStorage.getItem(sessionId)
            // 获取会话过期时间
            const expiry = localStorage.getItem(sessionId + '_expiry')

            // 检查会话是否过期（24小时有效期）
            if (!storedPaths || !expiry || Date.now() > parseInt(expiry)) {
              // 清理过期的 session 数据
              localStorage.removeItem(sessionId)
              localStorage.removeItem(sessionId + '_expiry')
              throw new Error('会话已过期，请重新选择文件夹')
            }

            // 解析存储的文件路径 JSON 字符串
            const paths = JSON.parse(storedPaths)
            // 加载所有 DICOM 文件
            const data = await this.$LoadImg.DCMFileLoad(paths)

            // 使用后清理 session 数据（一次性使用，增强安全性）
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
        // 兼容旧版本：直接使用 filePaths 参数（不推荐）
        else if (type === 'folder' && filePaths) {
          try {
            // 解析 JSON 格式的文件路径字符串
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

      // 没有找到任何数据源
      return null
    },

    // 加载 DICOM 数据的主方法
    async loadDicomData() {
      // 设置加载状态，显示加载遮罩
      this.loading = true
      this.error = null

      try {
        // 调用 getDicomData 方法获取数据
        const data = await this.getDicomData()

        // 数据验证：检查是否成功获取到数据
        if (!data) {
          throw new Error('未找到 DICOM 数据')
        }

        // 统一处理为数组格式：确保后续操作统一
        if (Array.isArray(data)) {
          this.seriesData = data
        } else {
          this.seriesData = [data]
        }

        // 检查数据是否为空数组
        if (this.seriesData.length === 0) {
          throw new Error('无法加载 DICOM 数据')
        }

        // 初始化渲染器，显示系列中的第一张图像
        await this.initRenderer(this.seriesData[0])
      } catch (err) {
        // 错误处理：捕获并显示错误信息
        console.error('加载 DICOM 数据失败:', err)
        this.error = err.message || '加载 DICOM 数据失败'
        // 使用 Element UI 的消息提示组件显示错误
        this.$message.error('加载 DICOM 数据失败: ' + err.message)
      } finally {
        // 无论成功失败，都结束加载状态
        this.loading = false
      }
    },

    // 初始化 DICOM 渲染器
    async initRenderer(dicomData) {
      // 获取 Canvas 相关的 DOM 元素
      const { dicomCanvas, canvasWrapper } = this.getCanvasElements()

      // 元素验证：确保 DOM 元素和 DICOM 数据都可用
      if (!dicomCanvas || !canvasWrapper || !dicomData) {
        this.error = 'Canvas 元素或 DICOM 数据不可用'
        return
      }

      // 设置加载状态
      this.loading = true
      this.error = null

      try {
        // 清理旧的渲染器实例，避免内存泄漏
        if (this.renderer) {
          this.renderer.destroy()
        }

        // 获取容器尺寸，用于自适应布局
        const containerWidth = canvasWrapper.clientWidth
        const containerHeight = canvasWrapper.clientHeight

        // 创建新的渲染器实例
        // 假设 this.$DICOMRenderer 是全局注册的 DICOM 渲染器类
        this.renderer = new this.$DICOMRenderer(
          dicomCanvas, // Canvas 元素，用于绘制图像
          dicomData, // DICOM 数据，包含像素数据等信息
          containerWidth, // 容器宽度，用于计算初始缩放
          containerHeight, // 容器高度，用于计算初始缩放
          {
            // 渲染配置参数
            windowWidth: this.windowWidth, // 窗宽设置
            windowCenter: this.windowCenter, // 窗位设置
            invert: this.invert, // 反色设置
            interpolation: this.interpolation // 插值设置
          }
        )

        // 执行渲染，等待渲染完成
        const success = await this.renderer.render()

        // 渲染成功后的处理
        if (success) {
          // 获取并更新图像信息，用于界面显示
          this.imageInfo = this.renderer.getImageInfo()
          // 更新缩放比例显示，scaleFactor 是渲染器内部的比例值
          this.zoomPercent = Math.round(this.renderer.scaleFactor * 100)
        } else {
          // 渲染失败时抛出异常
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
      if (!description) return '' // 空值处理
      if (description.length <= 20) return description // 短文本直接返回
      // 长文本截断并添加省略号
      return description.substring(0, 20) + '...'
    },

    // 处理鼠标移动事件（显示像素信息）
    handleMouseMove(event) {
      // 检查渲染器是否已初始化
      if (!this.renderer) return

      const { dicomCanvas } = this.getCanvasElements()
      if (!dicomCanvas) return

      // 获取 Canvas 相对于浏览器视口的位置和尺寸
      const rect = dicomCanvas.getBoundingClientRect()

      // 计算鼠标在 Canvas 上的坐标（相对于 Canvas 左上角）
      const x = Math.floor(event.clientX - rect.left)
      const y = Math.floor(event.clientY - rect.top)

      // 转换为原始图像坐标（考虑缩放因子）
      const imageX = Math.floor(x / this.renderer.scaleFactor)
      const imageY = Math.floor(y / this.renderer.scaleFactor)

      // 获取原始像素值（来自 DICOM 数据）
      const pixelValue = this.renderer.getPixelValue(imageX, imageY)

      // 如果获取到有效的像素值
      if (pixelValue !== null) {
        // 获取 DICOM 数据中的重定标参数
        const dicomData = this.renderer.dicomData
        // 计算 HU 值（Hounsfield Unit，CT 图像的标准单位）
        // 公式：HU = 像素值 × rescaleSlope + rescaleIntercept
        const huValue = pixelValue * dicomData.rescaleSlope + dicomData.rescaleIntercept

        // 计算显示值（应用窗宽窗位后的值，用于实际显示）
        const displayValue = this.renderer.applyWindowLevel(
          pixelValue,
          this.renderer.options.windowWidth,
          this.renderer.options.windowCenter
        )

        // 更新像素信息显示对象
        this.pixelInfo = {
          x: imageX, // 原始图像 X 坐标
          y: imageY, // 原始图像 Y 坐标
          value: pixelValue, // 原始像素值
          displayValue: Math.round(displayValue), // 显示像素值（四舍五入）
          huValue: Math.round(huValue) // HU 值（四舍五入）
        }
      }
    },

    // 清空像素信息（鼠标离开 Canvas 时）
    clearPixelInfo() {
      this.pixelInfo = null // 设置为 null 以隐藏像素信息显示
    },

    // 处理鼠标滚轮事件
    handleWheel(event) {
      // 阻止默认滚动行为，防止页面滚动
      event.preventDefault()

      if (!this.renderer) return

      // 检查是否按下 Ctrl 键（Windows/Linux）或 Cmd 键（Mac）
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
        // 更新缩放百分比
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
      // 使用容器宽高除以图像宽高，取较小值确保图像完整显示
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

        // 创建临时下载链接元素
        const link = document.createElement('a')
        link.href = dataURL // 设置链接为 Data URL
        // 设置下载文件名（包含时间戳避免重复）
        link.download = `DICOM_${Date.now()}.png`
        // 触发下载：将链接添加到 DOM，模拟点击，然后移除
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
      // event.offsetX 和 event.offsetY 提供点击位置（相对于 Canvas）
      console.log('Canvas clicked at:', event.offsetX, event.offsetY)
      // 未来可以在此处添加：添加标记点、开始测量等交互功能
    },

    // 重试加载数据（错误时调用）
    retryLoad() {
      this.error = null // 清空错误信息
      this.loadDicomData() // 重新加载数据
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

        // 计算自适应缩放比例（保持宽高比）
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
      this.$router.go(-1) // Vue Router 方法，返回浏览历史的上一步
    }
  }
}
</script>

<style scoped>
/* 主容器：全屏显示，深色主题 */
.dicom-viewer-container {
  height: 100vh; /* 使用视口高度，确保全屏显示 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列子元素 */
  background-color: #1a1a1a; /* 深灰背景，适合医学图像查看 */
  color: #fff; /* 白色文字 */
}

/* 头部控制栏样式 */
.viewer-header {
  display: flex; /* 水平排列 */
  align-items: center; /* 垂直居中对齐 */
  padding: 10px 20px; /* 内边距 */
  background-color: #2d2d2d; /* 稍亮的深灰 */
  border-bottom: 1px solid #444; /* 底部边框，作为分割线 */
}

/* 图像信息显示样式 */
.viewer-info {
  margin-left: 20px; /* 左侧外边距，与返回按钮保持距离 */
  display: flex; /* 水平排列信息项 */
  gap: 20px; /* 信息项之间的间距 */
  font-size: 14px; /* 字体大小 */
  color: #aaa; /* 浅灰色文字，降低视觉重要性 */
  flex-wrap: wrap; /* 允许换行，避免在小屏幕上溢出 */
}

/* 信息标签样式 */
.viewer-info span {
  padding: 4px 8px; /* 内边距，增加可点击区域 */
  background-color: #3a3a3a; /* 标签背景色 */
  border-radius: 4px; /* 圆角边框 */
}

/* 主内容区域 */
.main-content {
  flex: 1; /* 占据剩余空间，填满除头部外的区域 */
  display: flex; /* 水平排列左侧控制面板和图像显示区域 */
  overflow: hidden; /* 防止内容溢出容器 */
}

/* 左侧控制面板 */
.control-panel {
  width: 300px; /* 固定宽度 */
  padding: 20px; /* 内边距 */
  background-color: #2d2d2d; /* 背景色 */
  border-right: 1px solid #444; /* 右侧边框，作为分割线 */
  overflow-y: auto; /* 垂直滚动，内容过多时显示滚动条 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列子元素 */
  gap: 20px; /* 子元素之间的间距 */
}

/* 系列列表容器 */
.series-list-container {
  flex-shrink: 0; /* 防止压缩，保持固定高度 */
}

/* 系列列表卡片 */
.series-list-card {
  background-color: #3a3a3a; /* 卡片背景色 */
  border: none; /* 移除 Element UI 卡片的默认边框 */
}

/* 系列列表 */
.series-list {
  max-height: 400px; /* 最大高度，超过时显示滚动条 */
  overflow-y: auto; /* 垂直滚动 */
}

/* 系列列表项 */
.series-list-item {
  display: flex; /* 水平排列图标和信息 */
  align-items: center; /* 垂直居中对齐 */
  padding: 12px; /* 内边距 */
  margin-bottom: 8px; /* 底部外边距，与下一项保持距离 */
  background-color: #2d2d2d; /* 背景色 */
  border: 1px solid #444; /* 边框 */
  border-radius: 8px; /* 圆角边框 */
  cursor: pointer; /* 鼠标指针变为手型，表示可点击 */
  transition: all 0.3s ease; /* 所有属性过渡效果，0.3秒，缓动函数 */
  position: relative; /* 相对定位，用于绝对定位的子元素（角标） */
}

/* 悬停效果 */
.series-list-item:hover {
  background-color: #3a3a3a; /* 悬停时背景色变亮 */
  border-color: #409eff; /* 边框颜色变为 Element UI 主色 */
  transform: translateY(-2px); /* 向上移动 2 像素，产生浮起效果 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* 添加阴影，增强立体感 */
}

/* 选中状态 */
.series-list-item.active {
  background-color: #2a3a4a; /* 深蓝色背景，表示当前选中 */
  border-color: #409eff; /* 蓝色边框 */
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3); /* 蓝色阴影，增强选中效果 */
}

/* 系列图标 */
.series-icon {
  width: 40px; /* 固定宽度 */
  height: 40px; /* 固定高度 */
  display: flex; /* 弹性布局，用于居中图标 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  background: linear-gradient(135deg, #409eff, #67c23a); /* 渐变背景，蓝色到绿色 */
  border-radius: 6px; /* 圆角 */
  margin-right: 12px; /* 右侧外边距，与信息区域保持距离 */
  flex-shrink: 0; /* 防止压缩，保持固定大小 */
}

/* 图标文字 */
.series-icon .icon-text {
  font-size: 20px; /* 图标大小 */
  color: white; /* 白色图标 */
}

/* 系列信息区域 */
.series-info {
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 防止内容溢出，允许文本截断 */
}

/* 系列名称 */
.series-name {
  font-weight: bold; /* 粗体显示 */
  color: #fff; /* 白色文字 */
  margin-bottom: 4px; /* 底部外边距，与描述保持距离 */
  font-size: 14px; /* 字体大小 */
}

/* 系列描述（截断显示） */
.series-desc {
  font-size: 12px; /* 较小字体 */
  color: #aaa; /* 浅灰色文字 */
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis; /* 显示省略号表示截断 */
}

/* 序号角标 */
.series-badge {
  position: absolute; /* 绝对定位，相对于父元素 */
  top: -5px; /* 向上偏移 */
  right: -5px; /* 向右偏移 */
  background: #e6a23c; /* 橙色背景，醒目显示 */
  color: white; /* 白色文字 */
  border-radius: 10px; /* 圆形 */
  padding: 2px 6px; /* 内边距 */
  font-size: 10px; /* 小字体 */
  font-weight: bold; /* 粗体 */
  min-width: 20px; /* 最小宽度，确保圆形 */
  text-align: center; /* 文字居中 */
}

/* 像素信息卡片 */
.pixel-info-card {
  background-color: #3a3a3a; /* 卡片背景色 */
  border: none; /* 移除默认边框 */
}

/* 像素信息内容 */
.pixel-info {
  font-size: 14px; /* 字体大小 */
  color: #ccc; /* 浅灰色文字 */
}

/* 像素信息行 */
.pixel-info div {
  margin-bottom: 8px; /* 底部外边距，行间距 */
  padding: 4px 0; /* 上下内边距 */
  border-bottom: 1px solid #444; /* 底部边框，作为行分隔线 */
}

/* 操作卡片 */
.action-card {
  background-color: #3a3a3a; /* 卡片背景色 */
  border: none; /* 移除默认边框 */
}

/* 操作按钮容器 */
.action-buttons {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列按钮 */
  gap: 10px; /* 按钮之间的间距 */
}

/* 左对齐按钮 */
.action-buttons .el-button {
  justify-content: flex-start; /* 按钮文字左对齐 */
}

/* 控制面板头部样式 */
.control-header {
  font-size: 16px; /* 较大字体 */
  font-weight: bold; /* 粗体 */
  color: #fff; /* 白色文字 */
}

/* 图像显示区域 */
.image-container {
  flex: 1; /* 占据剩余空间 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 Canvas 和缩放控制 */
  padding: 20px; /* 内边距 */
  position: relative; /* 相对定位，用于绝对定位的子元素（遮罩层） */
}

/* Canvas 包装容器 */
.canvas-wrapper {
  flex: 1; /* 占据主要空间 */
  display: flex; /* 弹性布局，用于居中 Canvas */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  background-color: #000; /* 黑色背景，适合医学图像显示 */
  border: 1px solid #444; /* 边框 */
  border-radius: 4px; /* 圆角 */
  position: relative; /* 相对定位，用于绝对定位的子元素（遮罩层） */
  overflow: auto; /* 内容溢出时可滚动，适应大图像 */
}

/* Canvas 元素样式 */
canvas {
  display: block; /* 块级显示，消除行内元素间隙 */
  max-width: 100%; /* 最大宽度为容器宽度，响应式 */
  max-height: 100%; /* 最大高度为容器高度，响应式 */
  cursor: crosshair; /* 十字光标，适合图像测量操作 */
}

/* 加载和错误遮罩层 */
.loading-overlay,
.error-overlay {
  position: absolute; /* 绝对定位，覆盖在 Canvas 上 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列内容 */
  align-items: center; /* 水平居中 */
  justify-content: center; /* 垂直居中 */
  background-color: rgba(0, 0, 0, 0.8); /* 半透明黑色背景 */
  color: #fff; /* 白色文字 */
}

/* 加载图标旋转动画（示例，实际使用时需要对应的 HTML 结构） */
@keyframes rotating {
  0% {
    transform: rotate(0deg); /* 起始角度 */
  }
  100% {
    transform: rotate(360deg); /* 结束角度，完整旋转 */
  }
}

/* 缩放控制区域 */
.zoom-controls {
  margin-top: 10px; /* 顶部外边距，与 Canvas 容器保持距离 */
  text-align: center; /* 文字居中 */
}

/* 自定义滚动条样式（WebKit 浏览器） */
::-webkit-scrollbar {
  width: 8px; /* 垂直滚动条宽度 */
  height: 8px; /* 水平滚动条高度 */
}

/* 滚动条轨道 */
::-webkit-scrollbar-track {
  background: #2d2d2d; /* 轨道背景色 */
  border-radius: 4px; /* 圆角 */
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #555; /* 滑块背景色 */
  border-radius: 4px; /* 圆角 */
}

/* 滑块悬停效果 */
::-webkit-scrollbar-thumb:hover {
  background: #777; /* 悬停时滑块颜色变亮 */
}
</style>
