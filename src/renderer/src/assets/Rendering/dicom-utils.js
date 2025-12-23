// src/utils/dicom-utils.js

/**
 * DICOM数据管理器
 */
class DICOMDataManager {
  constructor() {
    this.currentSeries = null
    this.seriesList = []
  }

  /**
   * 设置当前系列数据
   * @param {Array|Object} data DICOM数据
   */
  setCurrentSeries(data) {
    this.currentSeries = data
    // 也存储到sessionStorage，以便页面刷新后仍能访问
    if (data) {
      sessionStorage.setItem('dicomCurrentSeries', JSON.stringify(data))
    }
  }

  /**
   * 获取当前系列数据
   * @returns {Array|Object} DICOM数据
   */
  getCurrentSeries() {
    if (this.currentSeries) {
      return this.currentSeries
    }

    // 从sessionStorage恢复
    const stored = sessionStorage.getItem('dicomCurrentSeries')
    if (stored) {
      try {
        this.currentSeries = JSON.parse(stored)
        return this.currentSeries
      } catch (err) {
        console.error('解析存储的DICOM数据失败:', err)
      }
    }

    return null
  }

  /**
   * 清空数据
   */
  clear() {
    this.currentSeries = null
    this.seriesList = []
    sessionStorage.removeItem('dicomCurrentSeries')
  }

  /**
   * 处理从解析器返回的数据
   * @param {Array} seriesData 系列数据
   * @returns {Array} 处理后的数据
   */
  processSeriesData(seriesData) {
    if (!seriesData || !Array.isArray(seriesData)) {
      return []
    }

    return seriesData.map((item, index) => ({
      id: index,
      seriesDescription: item.seriesDescription || `图像 ${index + 1}`,
      patientName: item.patientName || '未知',
      modality: item.modality || '未知',
      rows: item.rows || 0,
      columns: item.columns || 0,
      ...item
    }))
  }
}

// 创建单例实例
const dicomDataManager = new DICOMDataManager()

export default dicomDataManager
