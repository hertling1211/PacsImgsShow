<template>
  <div class="container">
    <!-- 自定义关闭按钮 -->
    <div class="custom-title">
      <div class="Window-menu">
        <div v-for="menu in menuData" :key="menu.name" class="menu-item">
          {{ menu.name }}
          <div class="submenu">
            <div
              v-for="item in menu.children"
              :key="item.name"
              class="submenu-item"
              @click="handleMenuClick(item)"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>
      <div class="Window-operation">
        <button class="Minimize" @click="handleWindowOperation('minimize')">-</button>
        <button class="close-icon" @click="handleWindowOperation('close')">×</button>
      </div>
    </div>

    <!-- 路由出口 -->
    <div class="router-view">
      <router-view />
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <!-- 版本号 -->
      <div>
        <p>Version：{{ version }}</p>
      </div>
      <!-- 清理缓存 -->
      <div>
        <span class="clean-cache" @click="handleCleanCache">清理缓存</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppLayout',
  data() {
    return {
      version: '1.0.0',
      menuData: [
        {
          name: '文件',
          label: 'file',
          children: [
            {
              name: '打开文件',
              label: 'open-file',
              link: '#'
            },
            {
              name: '打开文件夹',
              label: 'open-folder',
              link: '#'
            },
            // {
            //   name: '导入',
            //   label: 'import',
            //   link: '#'
            // },
            {
              name: '首选项',
              label: 'preferences',
              link: '/settings'
            },
            {
              name: '退出',
              label: 'exit',
              link: '#'
            }
          ]
        },
        {
          name: '帮助',
          label: 'help',
          children: [
            {
              name: '官网',
              label: 'official-website',
              link: '#'
            },
            {
              name: '检查更新',
              label: 'check-update',
              link: '#'
            },
            {
              name: '关于',
              label: 'about',
              link: '#'
            }
          ]
        }
      ]
    }
  },
  methods: {
    handleWindowOperation(operation) {
      console.log('用户点击了操作按钮:', operation)
      if (operation === 'minimize') {
        console.log('用户点击了最小化按钮 (-)')
        // 调用主进程的最小化窗口方法
        window.api.minimizeWindow()
      } else if (operation === 'close') {
        console.log('用户点击了关闭按钮 (×)')
        // 调用主进程的关闭窗口方法
        window.api.closeWindow()
      }
    },
    async handleMenuClick(item) {
      console.log(`点击了菜单项: ${item.name}`)
      // 在实际应用中，这里可以根据item.link进行路由跳转或其他操作
      // 注意：由于使用CSS方案，这里不需要手动关闭菜单
      // 判断一下item.link是不是为#
      if (item.link === '#') {
        // 点击打开文件
        if (item.label === 'open-file') {
          // 调用主进程的打开文件选择器方法
          const filePaths = await window.api.openFileDialog()
          console.log('选择的文件路径:', filePaths)
        }
        // 点击打开文件夹
        if (item.label === 'open-folder') {
          // 调用主进程的打开文件夹选择器方法
          const folderPaths = await window.api.openFolderDialog()
          console.log('选择的文件夹路径:', folderPaths)
        }
        // handleMenuClick方法中添加判断
        if (item.label === 'exit') {
          // 调用主进程的关闭窗口方法
          window.api.quitApp()
        }
        // 点击官网
        if (item.label === 'official-website') {
          // 调用主进程的打开官网方法
          // window.api.openOfficialWebsite()
          // 目前先使用element的alert弹窗提示官网正在制作中 确认按钮居中显示
          this.$alert('官网正在制作中，暂未开放', '重要提醒', {
            confirmButtonText: '确定',
            type: 'info',
            center: true
          })
        }
        // 点击检查更新
        if (item.label === 'check-update') {
          // 调用主进程的检查更新方法 获取github上面最新的relaese版本
          // window.api.checkUpdate()
          const checkUpdateResult = await window.api.checkUpdate()
          // console.log('checkUpdateResult:', checkUpdateResult)
          if (checkUpdateResult.success) {
            if (checkUpdateResult.updateAvailable) {
              this.$confirm(
                '发现新版本 ' +
                  checkUpdateResult.latestVersion +
                  '\n' +
                  checkUpdateResult.releaseNotes +
                  '\n是否前往下载？',
                '发现新版本',
                {
                  confirmButtonText: '前往下载',
                  cancelButtonText: '稍后',
                  type: 'info'
                }
              )
                .then(() => {
                  // 用户点击了前往下载按钮
                  window.open(checkUpdateResult.downloadUrl)
                })
                .catch(() => {
                  // 用户点击了稍后按钮
                  this.$message.info('稍后检查更新')
                })
            } else {
              this.$message.info('当前版本为最新版本')
            }
          } else {
            this.$message.error(checkUpdateResult.message)
          }
        }
        // 点击关于
        if (item.label === 'about') {
          // 调用主进程的打开关于方法
          // window.api.openAbout()
        }
      } else {
        // 点击其他菜单项，根据item.link进行路由跳转
        this.$router.push(item.link)
      }
    },
    async handleCleanCache() {
      try {
        // 使用Element Plus的MessageBox确认对话框
        await this.$confirm('确定要清理缓存吗？这将删除所有缓存数据。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        // 调用主进程的清理缓存方法
        const result = await window.api.cleanCache()
        console.log('清理缓存结果:', result)

        if (result.success) {
          this.$message.success(result.message)
          // 清理缓存成功后，刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          this.$message.error(result.message)
        }
      } catch (error) {
        // 用户点击取消或出现错误
        if (error === 'cancel') {
          console.log('用户点击了取消清理缓存')
          this.$message.info('已取消清理缓存')
        } else {
          console.error('清理缓存失败:', error)
          this.$message.error('清理缓存失败')
        }
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:root {
  --primary-color: #409eff;
  --hover-color: #ecf5ff;
  --border-color: #dcdfe6;
  --text-color: #606266;
  --bg-color: #f5f7fa;
  --danger-color: #f56c6c;
}
.router-view {
  flex: 1;
  overflow: auto;
  /* padding: 0 10px; */
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
}

.custom-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  padding: 0 10px;
  height: 40px;
  /*-webkit-app-region: drag;*/ /* 允许拖拽窗口 */
}

.Window-menu {
  display: flex;
  align-items: center;
}

.Window-menu .menu-item {
  position: relative;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s;
  -webkit-app-region: no-drag; /* 菜单项不允许拖拽 */
}

.Window-menu .menu-item:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

/* 子菜单样式 */
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 1000;
  padding: 5px 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.menu-item:hover .submenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.submenu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.submenu-item:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

.Window-operation {
  display: flex;
  -webkit-app-region: no-drag; /* 按钮区域不允许拖拽 */
}

.Window-operation button {
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  transition: all 0.2s;
  border-radius: 4px;
}

.Window-operation button:hover {
  background-color: #4caf50;
  color: aliceblue;
}

.Window-operation .close-icon:hover {
  background-color: var(--danger-color);
  color: aliceblue;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 12px;
  padding: 10px;
  /* 禁止选择 */
  user-select: none;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color);
}
.clean-cache {
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
}

.clean-cache:hover {
  color: var(--primary-color);
}
</style>
