/**
 * 解析DICOM文件
 */

// 引入dicom-parser库
import dicomParser from 'dicom-parser'

/**
 * 解析DICOM文件
 */
async function DCMFileLoad(file) {
  // 判断前端传递的是数组还是非数组
  if (Array.isArray(file)) {
    file.forEach((filePath) => {
      DCMFileLoad(filePath)
    })
    // 添加 return 语句，避免数组直接传递给 readFile
    return
  }
  // 如果不是数组，直接解析文件
  try {
    const dicomData = await window.api.readFile(file)

    // 检查返回的数据结构
    if (!dicomData || !dicomData.buffer) {
      console.error('未获取到有效的文件数据')
      return
    }

    // 从返回的数据中提取buffer
    const arrayBuffer = dicomData.buffer
    // console.log('文件大小:', arrayBuffer.length)

    // 不为空，调用DCMLoad函数解析文件
    if (arrayBuffer.length > 0) {
      const seriesInfo = await DCMLoad(arrayBuffer, file)
      console.log('seriesInfo:', seriesInfo)
    }
  } catch (error) {
    console.error('读取文件失败:', error)
  }
}
/**
 *
 * @param {Uint8Array} arrayBuffer Dicom文件的二进制数据
 * @param {string} fileName Dicom文件的文件名
 * @returns {object} 包含系列信息的对象
 */
async function DCMLoad(arrayBuffer, fileName) {
  try {
    // 验证缓冲区数据
    if (!arrayBuffer || arrayBuffer.length < 132) {
      console.error('文件数据过小或为空，可能不是有效的DICOM文件')
      return {
        seriesDescription: fileName.replace(/\.(dcm|dicom)$/i, ''),
        fileName,
        error: '文件数据无效'
      }
    }

    const byteArray = new Uint8Array(arrayBuffer)

    // 检查DICOM文件头（前132字节应该包含"DICM"标识）
    const header = new TextDecoder().decode(byteArray.slice(128, 132))
    if (header !== 'DICM') {
      console.warn('文件可能不是标准的DICOM格式，尝试继续解析')
    }

    const dataSet = dicomParser.parseDicom(byteArray)
    // 序列ID
    const seriesInstanceUID = dataSet.string('x0020000e') || 'UnknownSeriesUID'
    // 检查设备
    const modality = dataSet.string('x00080060') || 'Unknown'
    // 患者ID
    const patientID = dataSet.string('x00100020') || 'UnknownPatientID'
    // 序列描述
    let seriesDescription = dataSet.string('x0008103e') || ''
    // 身体部位
    const bodyPartExamined = dataSet.string('x00180015') || 'UnknownBodyPart'
    // 视图位置
    const viewPosition = dataSet.string('x00185101') || ''
    // 序列编号
    const seriesNumber = dataSet.string('x00200011') || '0'
    // 检查日期
    const studyDate = dataSet.string('x00080020') || 'UnknownDate'
    // 医院名称
    const institutionName = dataSet.string('x00080080') || 'UnknownInstitution'
    // 患者姓名
    const patientName = dataSet.string('x00100010') || 'UnknownPatientName'

    if (!seriesDescription) {
      seriesDescription = `${modality}-${bodyPartExamined}${viewPosition ? '-' + viewPosition : ''}`
    }

    const displayName = seriesDescription

    return {
      seriesDescription: displayName,
      seriesInstanceUID,
      modality,
      bodyPartExamined,
      viewPosition,
      seriesNumber,
      studyDate,
      patientID,
      fileName,
      institutionName,
      patientName
    }
  } catch (error) {
    console.error('提取系列信息失败:', error)
    return {
      seriesDescription: fileName.replace(/\.(dcm|dicom)$/i, ''),
      fileName,
      error: error.message
    }
  }
}
/**
 * 
 */
// 使用ES模块导出方式
export default {
  DCMFileLoad,
  DCMLoad
}
