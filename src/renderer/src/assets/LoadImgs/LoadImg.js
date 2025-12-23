// dicom_parse.js - 更新版本，添加像素数据解析
import dicomParser from 'dicom-parser'

/**
 * 解析DICOM文件
 * @param {string|Array<string>} file 要解析的DICOM文件路径，支持数组批量解析
 * @returns {Promise<object>} 解析后的系列信息对象，包含像素数据
 */
async function DCMFileLoad(file) {
  let seriesInfo = {}
  // 判断前端传递的是数组还是非数组
  if (Array.isArray(file)) {
    const results = []
    for (const filePath of file) {
      const result = await DCMFileLoad(filePath)
      if (result) results.push(result)
    }
    return results
  }
  // 如果不是数组，直接解析文件
  try {
    const dicomData = await window.api.readFile(file)

    // 检查返回的数据结构
    if (!dicomData || !dicomData.buffer) {
      console.error('未获取到有效的文件数据')
      return null
    }

    // 从返回的数据中提取buffer
    const arrayBuffer = dicomData.buffer

    // 不为空，调用DCMLoad函数解析文件
    if (arrayBuffer.length > 0) {
      seriesInfo = await DCMLoad(arrayBuffer, file)
      console.log('解析成功:', seriesInfo.seriesDescription)
      return seriesInfo
    }
  } catch (error) {
    console.error('读取文件失败:', error)
  }
  return null
}

/**
 * 提取DICOM文件的系列信息和像素数据
 * @param {Uint8Array} arrayBuffer Dicom文件的二进制数据
 * @param {string} fileName Dicom文件的文件名
 * @returns {object} 包含系列信息和像素数据的对象
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

    // 基本信息提取
    const seriesInstanceUID = dataSet.string('x0020000e') || 'UnknownSeriesUID'
    const modality = dataSet.string('x00080060') || 'Unknown'
    const patientID = dataSet.string('x00100020') || 'UnknownPatientID'
    let seriesDescription = dataSet.string('x0008103e') || ''
    const bodyPartExamined = dataSet.string('x00180015') || 'UnknownBodyPart'
    const viewPosition = dataSet.string('x00185101') || ''
    const seriesNumber = dataSet.string('x00200011') || '0'
    const studyDate = dataSet.string('x00080020') || 'UnknownDate'
    const institutionName = dataSet.string('x00080080') || 'UnknownInstitution'
    const patientName = dataSet.string('x00100010') || 'UnknownPatientName'

    // 图像参数提取
    const rows = dataSet.uint16('x00280010') || 512 // 默认值512
    const columns = dataSet.uint16('x00280011') || 512 // 默认值512
    const bitsAllocated = dataSet.uint16('x00280100') || 8
    const bitsStored = dataSet.uint16('x00280101') || bitsAllocated
    const highBit = dataSet.uint16('x00280102') || bitsStored - 1
    const pixelRepresentation = dataSet.uint16('x00280103') || 0 // 0: unsigned, 1: signed
    const samplesPerPixel = dataSet.uint16('x00280002') || 1
    const photometricInterpretation = dataSet.string('x00280004') || 'MONOCHROME2'
    const windowCenter = dataSet.floatString('x00281050') || 1024
    const windowWidth = dataSet.floatString('x00281051') || 2048
    const rescaleIntercept = dataSet.floatString('x00281052') || 0
    const rescaleSlope = dataSet.floatString('x00281053') || 1

    if (!seriesDescription) {
      seriesDescription = `${modality}-${bodyPartExamined}${viewPosition ? '-' + viewPosition : ''}`
    }

    const displayName = seriesDescription

    // 提取像素数据
    let pixelData = null
    let minPixelValue = Infinity
    let maxPixelValue = -Infinity

    try {
      // 获取像素数据元素
      const pixelDataElement = dataSet.elements.x7fe00010
      if (pixelDataElement) {
        // 根据位深度创建不同的数组
        if (bitsAllocated === 16) {
          if (pixelRepresentation === 0) {
            // 无符号16位
            pixelData = new Uint16Array(
              dataSet.byteArray.buffer,
              pixelDataElement.dataOffset,
              pixelDataElement.length / 2
            )
          } else {
            // 有符号16位
            pixelData = new Int16Array(
              dataSet.byteArray.buffer,
              pixelDataElement.dataOffset,
              pixelDataElement.length / 2
            )
          }
        } else if (bitsAllocated === 8) {
          // 8位像素数据
          pixelData = new Uint8Array(
            dataSet.byteArray.buffer,
            pixelDataElement.dataOffset,
            pixelDataElement.length
          )
        }

        // 计算像素值范围（可选，用于自动窗宽窗位）
        if (pixelData) {
          for (let i = 0; i < Math.min(pixelData.length, 10000); i++) {
            const value = pixelData[i]
            if (value < minPixelValue) minPixelValue = value
            if (value > maxPixelValue) maxPixelValue = value
          }
        }
      }
    } catch (error) {
      console.warn('提取像素数据失败:', error)
    }

    return {
      // 元数据
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
      patientName,

      // 图像参数
      rows,
      columns,
      bitsAllocated,
      bitsStored,
      highBit,
      pixelRepresentation,
      samplesPerPixel,
      photometricInterpretation,
      windowCenter: Array.isArray(windowCenter) ? windowCenter[0] : windowCenter,
      windowWidth: Array.isArray(windowWidth) ? windowWidth[0] : windowWidth,
      rescaleIntercept,
      rescaleSlope,

      // 像素数据
      pixelData,
      minPixelValue: minPixelValue === Infinity ? 0 : minPixelValue,
      maxPixelValue: maxPixelValue === -Infinity ? 255 : maxPixelValue,

      // 计算值
      aspectRatio: columns / rows,
      totalPixels: rows * columns
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
 * 加载并分类DICOM文件
 * @param {Array<string>} dicomFiles DICOM文件路径数组
 * @param {string} directoryPath 目录路径
 * @returns {Promise<Array>} 分类后的系列列表
 */
async function loadAndClassifyDicomFiles(dicomFiles, directoryPath) {
  const seriesMap = new Map()

  for (const file of dicomFiles) {
    try {
      const filePath = directoryPath + '/' + file
      console.log(`正在解析文件: ${file}`)

      const dicomData = await window.api.readFile(filePath)

      if (dicomData && dicomData.buffer) {
        const seriesInfo = await DCMLoad(dicomData.buffer, file)

        const seriesKey = seriesInfo.seriesInstanceUID

        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, {
            name: seriesInfo.seriesDescription,
            key: seriesKey,
            modality: seriesInfo.modality,
            bodyPart: seriesInfo.bodyPartExamined,
            images: []
          })
        }

        seriesMap.get(seriesKey).images.push({
          file,
          filePath,
          seriesInfo
        })

        console.log(`文件 ${file} 分配到系列: ${seriesInfo.seriesDescription}`)
      }
    } catch (error) {
      console.warn(`解析文件 ${file} 失败:`, error)
    }
  }

  const seriesList = Array.from(seriesMap.values()).sort((a, b) => {
    if (a.modality !== b.modality) {
      return a.modality.localeCompare(b.modality)
    }
    if (a.bodyPart !== b.bodyPart) {
      return a.bodyPart.localeCompare(b.bodyPart)
    }
    return a.name.localeCompare(b.name)
  })

  console.log('系列分类完成:', seriesList)
  return seriesList
}

// 使用ES模块导出方式
export default {
  DCMFileLoad,
  DCMLoad,
  loadAndClassifyDicomFiles
}
