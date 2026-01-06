<!-- 设置项读取Setting.json项 -->
<template>
  <div class="setting-container">
    <div class="setting-content">
      <h1>设置</h1>

      <!-- 设置表单内容 -->
      <div class="setting-form">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 通用设置 -->
          <el-tab-pane label="通用设置" name="common">
            <el-form :model="settings" label-width="120px">
              <el-form-item label="语言">
                <el-select v-model="currentLanguage" placeholder="请选择语言" style="width: 200px">
                  <el-option
                    v-for="lang in settings.Common.Language"
                    :key="lang.Value"
                    :label="lang.Text"
                    :value="lang.Value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="退出时间(秒)">
                <el-input-number
                  v-model="settings.Common.ExitTime"
                  :min="1"
                  :max="60"
                  controls-position="right"
                />
              </el-form-item>

              <el-form-item label="字体">
                <el-input
                  v-model="settings.Common.Font.Family"
                  placeholder="字体名称"
                  style="width: 150px"
                />
                <el-input-number
                  v-model="settings.Common.Font.Size"
                  :min="8"
                  :max="24"
                  controls-position="right"
                  style="margin-left: 10px; width: 100px"
                />
                <span style="margin-left: 5px">px</span>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 用户界面 -->
          <el-tab-pane label="用户界面" name="ui">
            <el-form :model="settings" label-width="120px">
              <el-form-item label="主题">
                <el-radio-group v-model="settings.UserInterface.Theme">
                  <el-radio label="Light">浅色</el-radio>
                  <el-radio label="Dark">深色</el-radio>
                  <el-radio label="Auto">自动</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="主窗口大小">
                <el-input-number
                  v-model="settings.UserInterface.MainWindow.Width"
                  :min="800"
                  :max="1920"
                  controls-position="right"
                  style="width: 100px"
                />
                <span style="margin: 0 5px">×</span>
                <el-input-number
                  v-model="settings.UserInterface.MainWindow.Height"
                  :min="600"
                  :max="1080"
                  controls-position="right"
                  style="width: 100px"
                />
              </el-form-item>

              <el-form-item label="窗口最大化">
                <el-switch v-model="settings.UserInterface.MainWindow.IsMaximized" />
              </el-form-item>

              <el-form-item label="显示工具栏">
                <el-switch v-model="settings.UserInterface.ShowToolbar" />
              </el-form-item>

              <el-form-item label="显示状态栏">
                <el-switch v-model="settings.UserInterface.ShowStatusBar" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 行为设置 -->
          <el-tab-pane label="行为设置" name="behavior">
            <el-form :model="settings" label-width="120px">
              <el-form-item label="退出前确认">
                <el-switch v-model="settings.Behavior.ConfirmBeforeExit" />
              </el-form-item>

              <el-form-item label="删除前确认">
                <el-switch v-model="settings.Behavior.ConfirmBeforeDelete" />
              </el-form-item>

              <el-form-item label="最大撤销步骤">
                <el-input-number
                  v-model="settings.Behavior.MaxUndoSteps"
                  :min="1"
                  :max="100"
                  controls-position="right"
                />
              </el-form-item>

              <el-form-item label="最近文件数量">
                <el-input-number
                  v-model="settings.Behavior.RecentFilesMaxCount"
                  :min="1"
                  :max="20"
                  controls-position="right"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 文件设置 -->
          <el-tab-pane label="文件设置" name="files">
            <el-form :model="settings" label-width="120px">
              <el-form-item label="默认保存路径">
                <el-input
                  v-model="settings.Files.DefaultSavePath"
                  placeholder="请输入默认保存路径"
                  style="width: 300px"
                >
                  <template #append>
                    <el-button @click="selectSavePath">选择路径</el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="自动保存">
                <el-switch v-model="settings.Files.AutoSave.Enabled" />
              </el-form-item>

              <el-form-item v-if="settings.Files.AutoSave.Enabled" label="自动保存间隔(分钟)">
                <el-input-number
                  v-model="settings.Files.AutoSave.IntervalInMinutes"
                  :min="1"
                  :max="60"
                  controls-position="right"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notifications">
            <el-form :model="settings" label-width="120px">
              <el-form-item label="启用声音">
                <el-switch v-model="settings.Notifications.EnableSound" />
              </el-form-item>

              <el-form-item label="检查更新">
                <el-switch v-model="settings.Notifications.CheckForUpdates" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <div class="settingSave">
      <el-button type="primary" @click="saveSettings">保存</el-button>
      <el-button type="info" @click="cancelChanges">取消</el-button>
      <el-button type="success" @click="applySettings">应用</el-button>
      <el-button type="danger" @click="resetToDefault">恢复默认</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Setting',
  data() {
    return {
      settings: {
        Common: {
          Language: [
            { Value: 'zh-CN', Text: '中文', Selected: true },
            { Value: 'en-US', Text: '英文', Selected: false }
          ],
          ExitTime: 5,
          Font: { Family: '微软雅黑', Size: 12 }
        },
        UserInterface: {
          Theme: 'Light',
          MainWindow: { Width: 1200, Height: 800, IsMaximized: false },
          ShowToolbar: true,
          ShowStatusBar: true
        },
        Behavior: {
          ConfirmBeforeExit: true,
          ConfirmBeforeDelete: true,
          MaxUndoSteps: 50,
          RecentFilesMaxCount: 10
        },
        Files: {
          DefaultSavePath: '',
          AutoSave: { Enabled: true, IntervalInMinutes: 5 }
        },
        Notifications: {
          EnableSound: true,
          CheckForUpdates: true
        }
      },
      originalSettings: {},
      activeTab: 'common',
      currentLanguage: 'zh-CN' // 当前选中的语言
    }
  },
  watch: {
    // 监听语言变化，更新Language数组中的Selected状态
    currentLanguage(newLang) {
      this.settings.Common.Language.forEach((lang) => {
        lang.Selected = lang.Value === newLang
      })
    }
  },
  async mounted() {
    await this.getSettings()
    // 备份原始设置用于取消操作
    this.originalSettings = JSON.parse(JSON.stringify(this.settings))
    // 初始化当前语言
    this.initCurrentLanguage()
  },
  methods: {
    // 初始化当前语言
    initCurrentLanguage() {
      const selectedLang = this.settings.Common.Language.find((lang) => lang.Selected)
      this.currentLanguage = selectedLang ? selectedLang.Value : 'zh-CN'
    },

    // 获取设置
    async getSettings() {
      try {
        if (
          !window.api ||
          !window.api.readSettings ||
          typeof window.api.readSettings !== 'function'
        ) {
          console.error('Settings API 未正确初始化')
          this.$message.error('设置功能不可用，请检查应用配置')
          return
        }

        const response = await window.api.readSettings()
        console.log('读取设置原始响应:', response)
        if (response.success) {
          this.settings = response.data
          this.originalSettings = JSON.parse(JSON.stringify(this.settings))
          this.initCurrentLanguage() // 初始化语言选择器
          console.log('成功读取设置:', this.settings)
        } else {
          console.error('读取设置失败:', response.error)
          this.$message.error('读取设置失败: ' + (response.message || '未知错误'))
        }
      } catch (error) {
        console.error('读取设置时发生错误:', error)
        this.$message.error('读取设置时发生错误: ' + error.message)
      }
    },

    // 保存设置
    async saveSettings() {
      try {
        if (!window.api || !window.api.writeSettings) {
          this.$message.error('保存设置功能不可用')
          return
        }

        const response = await window.api.writeSettings(JSON.stringify(this.settings))
        if (response.success) {
          this.$message.success('设置保存成功')
          this.originalSettings = JSON.parse(JSON.stringify(this.settings))
        } else {
          this.$message.error('保存设置失败: ' + (response.message || '未知错误'))
        }
      } catch (error) {
        console.error('保存设置时发生错误:', error)
        this.$message.error('保存设置时发生错误: ' + error.message)
      }
    },

    // 应用设置（不保存到文件）
    applySettings() {
      // 这里可以添加应用设置的逻辑，比如重新加载界面等
      this.$message.success('设置已应用')
    },

    // 取消更改
    cancelChanges() {
      this.settings = JSON.parse(JSON.stringify(this.originalSettings))
      this.initCurrentLanguage() // 重新初始化语言选择器
      this.$message.info('已取消更改')
    },

    // 恢复默认设置
    resetToDefault() {
      this.$confirm('确定要恢复默认设置吗？此操作不可撤销。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置为默认值
        this.settings = {
          Common: {
            Language: [
              { Value: 'zh-CN', Text: '中文', Selected: true },
              { Value: 'en-US', Text: '英文', Selected: false }
            ],
            ExitTime: 5,
            Font: { Family: '微软雅黑', Size: 12 }
          },
          UserInterface: {
            Theme: 'Light',
            MainWindow: { Width: 1200, Height: 800, IsMaximized: false },
            ShowToolbar: true,
            ShowStatusBar: true
          },
          Behavior: {
            ConfirmBeforeExit: true,
            ConfirmBeforeDelete: true,
            MaxUndoSteps: 50,
            RecentFilesMaxCount: 10
          },
          Files: {
            DefaultSavePath: '',
            AutoSave: { Enabled: true, IntervalInMinutes: 5 }
          },
          Notifications: {
            EnableSound: true,
            CheckForUpdates: true
          }
        }
        this.initCurrentLanguage() // 重新初始化语言选择器
        this.$message.success('已恢复默认设置')
      })
    },

    // 选择保存路径
    async selectSavePath() {
      try {
        if (window.api && window.api.openFolderDialog) {
          const result = await window.api.openFolderDialog()
          if (result) {
            this.settings.Files.DefaultSavePath = result
          }
        } else {
          this.$message.warning('文件夹选择功能不可用')
        }
      } catch (error) {
        console.error('选择路径时发生错误:', error)
        this.$message.error('选择路径失败: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.setting-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  height: 100%;
  background-color: #f5f5f5;
}

.setting-content {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.setting-content h1 {
  margin-bottom: 20px;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.setting-form {
  max-height: 500px;
  overflow-y: auto;
}

.settingSave {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-form-item {
  margin-bottom: 18px;
}

.el-tabs {
  margin-top: 10px;
}
</style>
