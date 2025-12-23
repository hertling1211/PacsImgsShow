/**
 * DICOM图像渲染器
 * @author Li Zezhong
 * @version 1.0.0
 * @date 2025/11/30
 */
class DICOMRenderer {
  /**
   * 构造函数
   * @param {HTMLCanvasElement} canvas 要渲染的Canvas元素
   * @param {object} dicomData 解析后的Dicom数据对象
   * @param {number} width 渲染宽度
   * @param {number} height 渲染高度
   * @param {object} options 渲染选项
   */
  constructor(canvas, dicomData, width, height, options = {}) {
    this.canvas = canvas
    this.dicomData = dicomData
    this.width = width
    this.height = height
    this.ctx = canvas.getContext('2d')

    // 默认参数
    this.options = {
      windowWidth: options.windowWidth || dicomData.windowWidth || 1024,
      windowCenter: options.windowCenter || dicomData.windowCenter || 512,
      minValue: options.minValue || 0,
      maxValue: options.maxValue || 255,
      invert: options.invert || false,
      interpolation: options.interpolation || true,
      ...options
    }

    // 内部状态
    this.imageData = null
    this.isRendering = false
    this.scaleFactor = 1

    // 初始化Canvas
    this.initCanvas()
  }

  /**
   * 初始化Canvas
   */
  initCanvas() {
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`

    // 设置图像平滑
    this.ctx.imageSmoothingEnabled = this.options.interpolation
    this.ctx.imageSmoothingQuality = 'high'

    // 计算缩放因子
    this.scaleFactor = Math.min(
      this.width / this.dicomData.columns,
      this.height / this.dicomData.rows
    )
  }

  /**
   * 窗宽窗位映射函数
   * @param {number} pixelValue 原始像素值
   * @param {number} windowWidth 窗宽
   * @param {number} windowCenter 窗中心
   * @returns {number} 映射后的像素值(0-255)
   */
  applyWindowLevel(pixelValue, windowWidth, windowCenter) {
    // 应用rescale slope和intercept
    const rescaledValue = pixelValue * this.dicomData.rescaleSlope + this.dicomData.rescaleIntercept

    // 计算窗宽窗位
    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2

    let displayValue
    if (rescaledValue <= windowMin) {
      displayValue = this.options.minValue
    } else if (rescaledValue >= windowMax) {
      displayValue = this.options.maxValue
    } else {
      displayValue =
        ((rescaledValue - windowMin) / windowWidth) *
          (this.options.maxValue - this.options.minValue) +
        this.options.minValue
    }

    // 反转图像（如果需要）
    if (this.options.invert) {
      displayValue = this.options.maxValue - (displayValue - this.options.minValue)
    }

    return Math.max(this.options.minValue, Math.min(this.options.maxValue, displayValue))
  }

  /**
   * 将像素数据转换为ImageData
   * @returns {ImageData} 图像数据
   */
  convertToImageData() {
    const { rows, columns, pixelData } = this.dicomData
    const { windowWidth, windowCenter } = this.options

    // 验证图像尺寸是否有效
    if (!rows || !columns || rows <= 0 || columns <= 0) {
      console.error('无效的图像尺寸:', { rows, columns })
      return null
    }

    // 创建ImageData对象
    const imageData = this.ctx.createImageData(columns, rows)
    const data = imageData.data

    if (!pixelData) {
      console.error('没有可用的像素数据')
      return null
    }

    // 根据位深度处理像素数据
    if (this.dicomData.bitsAllocated === 16) {
      this.convert16BitToRGBA(pixelData, data, rows, columns, windowWidth, windowCenter)
    } else if (this.dicomData.bitsAllocated === 8) {
      this.convert8BitToRGBA(pixelData, data, rows, columns, windowWidth, windowCenter)
    } else {
      console.error(`不支持的位深度: ${this.dicomData.bitsAllocated}`)
      return null
    }

    return imageData
  }

  /**
   * 转换16位像素数据为RGBA
   */
  convert16BitToRGBA(pixelData, outputData, rows, columns, windowWidth, windowCenter) {
    const length = rows * columns

    for (let i = 0; i < length; i++) {
      const pixelValue = pixelData[i]
      const displayValue = this.applyWindowLevel(pixelValue, windowWidth, windowCenter)

      const index = i * 4
      outputData[index] = displayValue // R
      outputData[index + 1] = displayValue // G
      outputData[index + 2] = displayValue // B
      outputData[index + 3] = 255 // A
    }
  }

  /**
   * 转换8位像素数据为RGBA
   */
  convert8BitToRGBA(pixelData, outputData, rows, columns, windowWidth, windowCenter) {
    const length = rows * columns

    for (let i = 0; i < length; i++) {
      const pixelValue = pixelData[i]
      const displayValue = this.applyWindowLevel(pixelValue, windowWidth, windowCenter)

      const index = i * 4
      outputData[index] = displayValue // R
      outputData[index + 1] = displayValue // G
      outputData[index + 2] = displayValue // B
      outputData[index + 3] = 255 // A
    }
  }

  /**
   * 渲染DICOM图像到Canvas
   * @param {boolean} useCache 是否使用缓存
   * @returns {Promise<boolean>} 渲染是否成功
   */
  async render(useCache = true) {
    if (this.isRendering) return false

    this.isRendering = true

    try {
      // 清空Canvas
      this.ctx.clearRect(0, 0, this.width, this.height)

      // 转换像素数据
      if (!this.imageData || !useCache) {
        this.imageData = this.convertToImageData()
        if (!this.imageData) {
          this.isRendering = false
          return false
        }
      }

      // 创建离屏Canvas用于高质量缩放
      const offscreenCanvas = document.createElement('canvas')
      const offscreenCtx = offscreenCanvas.getContext('2d')

      offscreenCanvas.width = this.dicomData.columns
      offscreenCanvas.height = this.dicomData.rows

      // 将ImageData绘制到离屏Canvas
      offscreenCtx.putImageData(this.imageData, 0, 0)

      // 计算绘制位置和尺寸（保持宽高比）
      const drawWidth = this.dicomData.columns * this.scaleFactor
      const drawHeight = this.dicomData.rows * this.scaleFactor
      const offsetX = (this.width - drawWidth) / 2
      const offsetY = (this.height - drawHeight) / 2

      // 绘制到主Canvas（带平滑缩放）
      this.ctx.drawImage(
        offscreenCanvas,
        0,
        0,
        this.dicomData.columns,
        this.dicomData.rows,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      )

      this.isRendering = false
      return true
    } catch (error) {
      console.error('渲染失败:', error)
      this.isRendering = false
      return false
    }
  }

  /**
   * 更新渲染参数
   * @param {object} newOptions 新的渲染选项
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
    this.imageData = null // 清除缓存，强制重新渲染
  }

  /**
   * 设置窗宽窗位
   * @param {number} windowWidth 窗宽
   * @param {number} windowCenter 窗中心
   */
  setWindowLevel(windowWidth, windowCenter) {
    this.updateOptions({ windowWidth, windowCenter })
  }

  /**
   * 自动设置窗宽窗位
   */
  setAutoWindowLevel() {
    const { minPixelValue, maxPixelValue } = this.dicomData
    const windowWidth = maxPixelValue - minPixelValue
    const windowCenter = (maxPixelValue + minPixelValue) / 2
    this.setWindowLevel(windowWidth, windowCenter)
  }

  /**
   * 重置为默认参数
   */
  reset() {
    this.updateOptions({
      windowWidth: this.dicomData.windowWidth || 1024,
      windowCenter: this.dicomData.windowCenter || 512,
      invert: false
    })
  }

  /**
   * 获取像素值
   * @param {number} x X坐标
   * @param {number} y Y坐标
   * @returns {number|null} 像素值
   */
  getPixelValue(x, y) {
    const { columns, pixelData } = this.dicomData
    if (!pixelData || x < 0 || x >= columns || y < 0) return null

    const index = y * columns + x
    if (index >= pixelData.length) return null

    return pixelData[index]
  }

  /**
   * 获取图像信息
   * @returns {object} 图像信息
   */
  getImageInfo() {
    const {
      rows,
      columns,
      bitsAllocated,
      //   windowWidth,
      //   windowCenter,
      seriesDescription,
      modality,
      patientName,
      studyDate
    } = this.dicomData

    return {
      dimensions: `${columns}×${rows}`,
      bitDepth: bitsAllocated,
      windowWidth: this.options.windowWidth,
      windowCenter: this.options.windowCenter,
      seriesDescription,
      modality,
      patientName,
      studyDate,
      zoom: Math.round(this.scaleFactor * 100) + '%'
    }
  }

  /**
   * 导出为DataURL
   * @param {string} format 格式，默认为'image/png'
   * @param {number} quality 质量(0-1)，仅适用于JPEG
   * @returns {string} DataURL
   */
  exportToDataURL(format = 'image/png', quality = 1) {
    return this.canvas.toDataURL(format, quality)
  }

  /**
   * 调整Canvas尺寸
   * @param {number} width 新宽度
   * @param {number} height 新高度
   */
  resize(width, height) {
    this.width = width
    this.height = height
    this.initCanvas()
    this.render()
  }

  /**
   * 销毁渲染器，释放资源
   */
  destroy() {
    this.imageData = null
    this.dicomData = null
    this.canvas = null
    this.ctx = null
  }
}

export default DICOMRenderer
