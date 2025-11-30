import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 添加关闭窗口的方法
  closeWindow: () => ipcRenderer.send('close-window'),
  // 添加最小化窗口的方法
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  cleanCache: () => ipcRenderer.invoke('clean-cache'),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  quitApp: () => ipcRenderer.send('quit-app'),
  // 打开文件选择器
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  // 打开文件夹选择器
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  // 添加打开文件夹
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  // 读取文件
  readFile: (filePath) => ipcRenderer.invoke('read-dicom-file', filePath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
