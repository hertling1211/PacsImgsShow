/**
 * 渲染类，用来将解析出来的Dicom文件渲染到Canvas上
 * @param {HTMLCanvasElement} canvas 要渲染的Canvas元素
 * @param {object} dicomData 解析后的Dicom数据对象
 * @param {number} width 渲染宽度
 * @param {number} height 渲染高度
 * @param {number} [windowWidth=1024] 窗宽，默认值为1024
 * @param {number} [windowCenter=512] 窗中心，默认值为512
 * @param {number} [minValue=0] 最小值，默认值为0
 * @param {number} [maxValue=255] 最大值，默认值为255
 * @param {number} [minPixelValue=0] 像素最小值，默认值为0
 * @param {number} [maxPixelValue=255] 像素最大值，默认值为255
 * @author Li Zezhong
 * @version 1.0.0
 * @date 2025/11/30
 */
