// 导入必要的Electron模块和工具
import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
  dialog
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// import fs from 'fs' // 添加fs模块导入

// 全局变量，用于存储窗口和托盘引用
let mainWindow = null
let tray = null

/**
 * 获取适应屏幕缩放后的窗口尺寸
 * 考虑系统缩放比例，返回实际像素尺寸
 */
function getAdaptiveWindowSize() {
  // 获取主显示器的信息
  const primaryDisplay = screen.getPrimaryDisplay()
  const { workArea, scaleFactor } = primaryDisplay

  console.log(
    `Workspace information: ${workArea.width}x${workArea.height}, Zoom ratio: ${scaleFactor}`
  )

  // 返回适应缩放后的工作区尺寸
  return {
    width: Math.floor(workArea.width),
    height: Math.floor(workArea.height)
  }
}

/**
 * 创建主窗口函数
 * 初始化浏览器窗口并设置相关事件监听
 */
function createWindow() {
  // 获取适应屏幕缩放的窗口尺寸
  const windowSize = getAdaptiveWindowSize()

  // 创建浏览器窗口配置
  mainWindow = new BrowserWindow({
    ...windowSize, // 使用自适应屏幕尺寸
    x: 0, // 窗口X坐标
    y: 0, // 窗口Y坐标
    show: false, // 初始不显示窗口
    frame: false, // 无边框窗口
    resizable: false, // 禁止手动调整窗口大小
    minimizable: true, // 允许最小化
    maximizable: false, // 禁止最大化按钮（因为已经是最大化状态）
    closable: true, // 允许关闭
    webSecurity: false, // 绕过web安全
    autoHideMenuBar: true, // 自动隐藏菜单栏
    roundedCorners: false, // 禁用圆角窗口
    ...(process.platform === 'linux' ? { icon } : {}), // Linux系统设置图标
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // 预加载脚本
      sandbox: false, // 禁用沙箱模式
      // 启用额外的缩放支持
      enablePreferredSizeMode: true
    }
  })

  // 移除菜单栏（完全移除而不仅仅是隐藏）
  mainWindow.setMenu(null)

  // 窗口准备就绪时显示
  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      // 确保窗口获得焦点
      mainWindow.focus()
    }
  })

  // 监听显示器配置变化（包括缩放比例变化）
  screen.on('display-metrics-changed', (event, display, changedMetrics) => {
    console.log('Display metrics changed:', changedMetrics)
    if (mainWindow && changedMetrics.includes('scaleFactor')) {
      // 缩放比例变化时重新调整窗口大小
      const newSize = getAdaptiveWindowSize()
      mainWindow.setBounds({
        x: 0,
        y: 0,
        width: newSize.width,
        height: newSize.height
      })
    }
  })

  // 关闭事件处理
  mainWindow.on('close', (event) => {
    // 在Windows和Linux上，点击关闭按钮时隐藏窗口而不是退出
    if (process.platform !== 'darwin') {
      event.preventDefault() // 阻止默认关闭行为
      if (mainWindow) {
        mainWindow.hide() // 隐藏窗口
      }
    }
  })

  // 处理新窗口打开请求
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url) // 在默认浏览器中打开外部链接
    return { action: 'deny' } // 阻止在应用中打开新窗口
  })

  // 基于 electron-vite cli 的渲染器热重载
  // 开发环境下加载远程URL，生产环境下加载本地html文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']) // 开发环境URL
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')) // 生产环境本地文件
  }

  // 创建托盘图标
  createTray()
}

/**
 * 创建系统托盘图标
 * 设置托盘菜单和点击事件
 */
function createTray() {
  // 从图标路径创建原生图像
  const trayIcon = nativeImage.createFromPath(icon)
  // 创建托盘图标（调整大小为16x16）
  tray = new Tray(trayIcon.resize({ width: 32, height: 32 }))

  // 托盘上下文菜单配置
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出应用', // 退出菜单项
      click: () => {
        // 退出应用前清除引用
        if (tray) {
          tray.destroy()
          tray = null
        }
        app.quit() // 退出应用
      }
    }
  ])

  // 设置托盘提示文本
  tray.setToolTip('ASUntil')

  // 设置托盘上下文菜单
  tray.setContextMenu(contextMenu)

  // 托盘图标点击事件
  tray.on('click', () => {
    if (!mainWindow) return

    if (mainWindow.isVisible()) {
      // 如果窗口可见，点击后隐藏
      mainWindow.hide()
    } else {
      // 如果窗口隐藏，点击后显示并确保位置和大小正确
      const newSize = getAdaptiveWindowSize()
      mainWindow.setBounds({
        x: 0,
        y: 0,
        width: newSize.width,
        height: newSize.height
      })
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

/**
 * 检查GitHub更新
 * 从GitHub releases获取最新版本信息
 */
async function checkForUpdates() {
  try {
    const currentVersion = app.getVersion()
    const owner = 'hertling1211' // 替换为实际的GitHub用户名
    const repo = 'PacsImgsShow' // 替换为实际的仓库名

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`)
    console.log('checkForUpdates response:', response)

    if (!response.ok) {
      throw new Error(`Server Connected Failed: ${response.status}`)
    }

    const latestRelease = await response.json()
    const latestVersion = latestRelease.tag_name.replace(/^v/, '') // 移除可能的前缀 "v"

    const isUpdateAvailable = compareVersions(latestVersion, currentVersion) > 0

    return {
      success: true,
      updateAvailable: isUpdateAvailable,
      currentVersion,
      latestVersion,
      releaseNotes: latestRelease.body,
      downloadUrl: latestRelease.html_url,
      assets: latestRelease.assets
    }
  } catch (error) {
    console.error('checkUpdate failed:', error)
    return {
      success: false,
      message: `检查更新失败: ${error.message}`,
      currentVersion: app.getVersion()
    }
  }
}

/**
 * 比较版本号
 * @param {string} v1 版本1
 * @param {string} v2 版本2
 * @returns {number} 1: v1 > v2, -1: v1 < v2, 0: 相等
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }

  return 0
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
// 某些API只能在此事件发生后使用
app.whenReady().then(() => {
  // 设置应用单实例锁，防止多个实例同时运行
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    // 如果已经有实例运行，则退出当前实例
    app.quit()
    return
  } else {
    // 当另一个实例被启动时，会触发这个事件
    app.on('second-instance', () => {
      // 有人试图运行第二个实例，我们应该聚焦我们的窗口
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore() // 如果最小化则恢复
        }
        // 确保窗口位置和大小正确
        const newSize = getAdaptiveWindowSize()
        mainWindow.setBounds({
          x: 0,
          y: 0,
          width: newSize.width,
          height: newSize.height
        })
        mainWindow.show() // 显示窗口
        mainWindow.focus() // 聚焦窗口
      }
    })
  }

  // 为 Windows 设置应用用户模型 ID
  electronApp.setAppUserModelId('com.electron')

  // 开发环境下默认按F12打开或关闭DevTools
  // 生产环境下忽略 CommandOrControl + R
  // 参见 https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC 测试 - 监听ping消息
  ipcMain.on('ping', () => console.log('pong'))

  // 清理缓存
  ipcMain.handle('clean-cache', async () => {
    try {
      // 清除浏览器缓存
      if (mainWindow && mainWindow.webContents) {
        await mainWindow.webContents.session.clearCache()
      }

      return { success: true, message: '缓存清理成功' }
    } catch (error) {
      return { success: false, message: `缓存清理失败: ${error.message}` }
    }
  })
  // 退出应用
  ipcMain.on('quit-app', () => {
    app.quit() // 退出应用
  })

  // 检查更新 - 修复后的完整实现
  ipcMain.handle('check-update', async () => {
    try {
      const updateInfo = await checkForUpdates()
      return updateInfo
    } catch (error) {
      return {
        success: false,
        message: `检查更新失败: ${error.message}`,
        currentVersion: app.getVersion()
      }
    }
  })

  // 创建主窗口
  createWindow()

  // 应用激活事件（macOS专用）
  app.on('activate', function () {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      // 如果窗口已存在，则显示它
      if (mainWindow.isMinimized()) {
        mainWindow.restore() // 恢复最小化的窗口
      }
      // 确保窗口位置和大小正确
      const newSize = getAdaptiveWindowSize()
      mainWindow.setBounds({
        x: 0,
        y: 0,
        width: newSize.width,
        height: newSize.height
      })
      mainWindow.show() // 显示窗口
      mainWindow.focus() // 聚焦窗口
    }
  })
})

// 当所有窗口都关闭时退出，macOS除外
// 在macOS上，应用程序及其菜单栏通常保持活动状态，直到用户使用Cmd + Q显式退出
app.on('window-all-closed', () => {
  // 在非macOS平台上，我们不再退出应用，而是隐藏窗口
  // 实际退出操作将通过托盘菜单中的"退出"选项执行
  if (process.platform !== 'darwin') {
    // 不退出应用，保持后台运行
    // 只清除窗口引用
    mainWindow = null
  }
})

// 应用即将退出时清理资源
app.on('before-quit', () => {
  // 确保窗口完全关闭
  if (mainWindow) {
    mainWindow.removeAllListeners('close') // 移除所有关闭监听器
    mainWindow.close() // 关闭窗口
  }
})

// 添加IPC监听器，处理来自渲染进程的关闭窗口请求
ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.hide() // 隐藏窗口而不是关闭
    // app.quit() // 关闭窗口
  }
})

// 添加IPC监听器，处理来自渲染进程的最小化窗口请求
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize() // 最小化窗口
  }
})

/**
 * 打开文件选择器，允许用户选择文件 只显示.dcm或者是.dicom文件
 * @returns {Promise<{canceled: boolean, filePath?: string, error?: string}>}
 */
ipcMain.handle('open-file-dialog', async () => {
  const dialogOptions = {
    title: '选择文件',
    buttonLabel: '打开',
    filters: [
      // { name: '所有文件', extensions: ['*'] },
      { name: 'DICOM 文件', extensions: ['dcm', 'dicom'] }
      // 可以添加其他文件类型过滤器
    ],
    properties: ['openFile']
  }

  try {
    const result = await dialog.showOpenDialog(dialogOptions)
    if (result.canceled) {
      return { canceled: true }
    }
    return { canceled: false, filePath: result.filePaths[0] }
  } catch (error) {
    console.error('打开文件对话框出错:', error)
    return { canceled: true, error: error.message }
  }
})
/**
 * 打开文件夹选择器，允许用户选择文件夹
 */
ipcMain.handle('open-folder-dialog', async () => {
  const dialogOptions = {
    title: '选择文件夹',
    buttonLabel: '打开',
    properties: ['openDirectory']
  }

  try {
    const result = await dialog.showOpenDialog(dialogOptions)
    if (result.canceled) {
      return { canceled: true }
    }
    return { canceled: false, folderPath: result.filePaths[0] }
  } catch (error) {
    console.error('打开文件夹对话框出错:', error)
    return { canceled: true, error: error.message }
  }
})
