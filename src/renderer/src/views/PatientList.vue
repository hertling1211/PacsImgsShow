<template>
  <div class="patient-list-container">
    <div class="patient-list-content">
      <div class="title-container">
        <!-- 返回按钮放在标题容器内 -->
        <div class="backHomePatientList">
          <el-button class="backHomePatientListBtn" @click="backHome">返回首页</el-button>
        </div>
        <span class="patient-list-title">患者列表</span>
      </div>
      <!-- 搜索框 -->
      <div class="search-box">
        <div class="search-box-content">
          <div class="search-box-input">
            <el-input
              v-model="searchText"
              placeholder="请输入患者姓名或ID"
              clearable
              @keyup.enter="search"
            />
          </div>
          <span class="search-box-button">
            <el-button type="primary" @click="search">搜索</el-button>
          </span>
        </div>
      </div>
    </div>
    <div class="patient-Content">
      <!-- 卡片式患者列表 -->
      <div class="patient-list-content-list">
        <div
          v-for="patient in filteredPatients"
          :key="patient.PatientID"
          class="patient-list-content-list-item"
        >
          <!-- 移除头像，直接显示患者信息 -->
          <div class="patient-list-content-list-item-content">
            <div class="patient-list-content-list-item-content-title">
              <span class="patient-list-content-list-item-content-title-name">{{
                patient.PatientName
              }}</span>
              <span class="patient-list-content-list-item-content-title-id">{{
                patient.PatientID
              }}</span>
            </div>
            <div class="patient-list-content-list-item-content-body">
              <div class="patient-list-content-list-item-content-body-detail">
                <span class="patient-list-content-list-item-content-body-detail-label"
                  >检查部位:</span
                >
                <span class="patient-list-content-list-item-content-body-detail-value">{{
                  formatBodyPart(patient.body)
                }}</span>
              </div>
              <div class="patient-list-content-list-item-content-body-detail">
                <span class="patient-list-content-list-item-content-body-detail-label"
                  >图像类型:</span
                >
                <span class="patient-list-content-list-item-content-body-detail-value">{{
                  formatImageType(patient.imageType)
                }}</span>
              </div>
              <div class="patient-list-content-list-item-content-body-detail">
                <span class="patient-list-content-list-item-content-body-detail-label"
                  >接收日期:</span
                >
                <span class="patient-list-content-list-item-content-body-detail-value">{{
                  patient.ReceiveDate
                }}</span>
              </div>
            </div>
            <div class="patient-list-content-list-item-content-footer">
              <el-button size="small" type="primary" @click="viewPatient(patient)"
                >查看详情</el-button
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-if="filteredPatients.length === 0" class="patient-list-content-list-no-data">
        <p>{{ searchText ? '未找到匹配的患者' : '暂无患者数据' }}</p>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'PatientList',
  data() {
    return {
      // 搜索文本
      searchText: '',
      // 原始患者列表数据
      allPatients: [
        {
          PatientName: '张三',
          PatientID: '123456',
          body: 'brain',
          imageType: 'CT',
          ReceiveDate: '2023-08-15'
        },
        {
          PatientName: '李四',
          PatientID: '654321',
          body: 'brain',
          imageType: 'MR',
          ReceiveDate: '2023-08-15'
        },
        {
          PatientName: '王五',
          PatientID: '789012',
          body: 'chest',
          imageType: 'CBCT',
          ReceiveDate: '2023-08-16'
        },
        {
          PatientName: '赵六',
          PatientID: '345678',
          body: 'abdomen',
          imageType: 'CT',
          ReceiveDate: '2023-08-17'
        },
        {
          PatientName: '孙七',
          PatientID: '901234',
          body: 'bone',
          imageType: 'MR',
          ReceiveDate: '2023-08-18'
        },
        {
          PatientName: '肖八',
          PatientID: '901204',
          body: 'bone',
          imageType: 'MR',
          ReceiveDate: '2025-08-18'
        }
      ]
    }
  },
  computed: {
    // 根据搜索文本过滤患者列表
    filteredPatients() {
      if (!this.searchText.trim()) {
        return this.allPatients
      }

      const searchTerm = this.searchText.toLowerCase().trim()
      return this.allPatients.filter(
        (patient) =>
          patient.PatientName.toLowerCase().includes(searchTerm) ||
          patient.PatientID.toLowerCase().includes(searchTerm) ||
          patient.imageType.toLowerCase().includes(searchTerm)
      )
    }
  },
  methods: {
    backHome() {
      this.$router.push({ name: 'Home' })
    },
    // 搜索方法
    search() {
      // 搜索逻辑已通过computed属性实现，这里可以添加额外的搜索相关操作
      console.log('搜索关键词:', this.searchText)
    },
    // 格式化身体部位显示
    formatBodyPart(part) {
      const partMap = {
        brain: '脑部',
        chest: '胸部',
        abdomen: '腹部',
        bone: '骨骼'
      }
      return partMap[part] || part
    },
    // 完善的医学影像类型格式化函数
    formatImageType(type) {
      const typeMap = {
        // 放射影像
        CR: '计算机X线摄影',
        DX: '数字化X射线',
        MG: '乳腺X线摄影',
        DR: '数字化放射成像',

        // CT类
        CT: 'CT',
        CBCT: 'CBCT',

        // MR类
        MR: '磁共振',
        MRA: '磁共振血管成像',
        fMRI: '功能性磁共振',

        // 核医学
        PT: 'PET', // DICOM标准中PET的代码是PT
        NM: '核医学',
        PET: 'PET',
        PETCT: 'PET-CT',
        PETMR: 'PET-MR',

        // 超声
        US: '超声',
        ECHO: '超声心动图',

        // 透视/血管造影
        RF: '荧光透视',
        XA: 'X射线血管造影',
        DSA: '数字减影血管造影',

        // 其他
        OCT: '光学相干断层扫描',
        ES: '内窥镜',
        ECG: '心电图',
        EPS: '心脏电生理检查',

        // 放疗相关
        RTIMAGE: '放疗影像',
        RTPLAN: '放疗计划',
        RTDOSE: '放疗剂量',

        // 基础X光
        XRAY: 'X光',
        XR: 'X射线'
      }

      // 处理可能的空值或undefined
      if (!type) return '未知影像类型'

      // 转换为大写以确保匹配
      const upperType = type.toUpperCase()

      return typeMap[upperType] || type
    },
    // 查看患者详情
    viewPatient(patient) {
      // 这里可以添加跳转到患者详情页的逻辑
      console.log('查看患者详情:', patient)
      // 示例：this.$router.push({ name: 'PatientDetail', params: { id: patient.PatientID } });
    }
  }
}
</script>
<style scoped>
.patient-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.patient-list-container .patient-list-content {
  width: 100%;
  display: flex;
  position: relative;
  overflow: hidden;
  justify-content: space-between;
  padding: 10px 10px;
}

/* 标题容器样式保持不变 */
.patient-list-container .patient-list-content .title-container {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.patient-list-container .patient-list-content .title-container .backHomePatientList {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 0;
  overflow: hidden;
  margin-right: 0;
}

.patient-list-container .patient-list-content .title-container:hover .backHomePatientList {
  opacity: 1;
  transform: translateX(0);
  width: auto;
  margin-right: 10px;
}

.patient-list-container .patient-list-content .title-container .patient-list-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  transition: color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 搜索框样式修改 - 添加固定宽度 */
.patient-list-container .patient-list-content .search-box {
  display: flex;
  align-items: center;
}

.patient-list-container .patient-list-content .search-box .search-box-content {
  display: flex;
  align-items: center;
}

.patient-list-container .patient-list-content .search-box .search-box-content .search-box-input {
  margin-right: 10px;
  width: 200px;
  min-width: 200px;
}

.patient-list-container .patient-list-content .search-box .search-box-content .search-box-button {
  display: flex;
  align-items: center;
}

/* 患者列表内容区 */
.patient-list-container .patient-Content {
  flex: 1;
  padding: 0 10px;
  overflow-y: auto;
}

/* 患者卡片列表容器 - 网格布局 */
.patient-list-container .patient-Content .patient-list-content-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

/* 患者卡片样式 - 减小间隙 */
.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

/* 患者卡片内容 */
.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 患者卡片标题区 */
.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-title-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-title
  .patient-list-content-list-item-content-title-id {
  font-size: 12px;
  color: #666;
}

/* 患者卡片详细信息 */
.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-body
  .patient-list-content-list-item-content-body-detail {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-body
  .patient-list-content-list-item-content-body-detail
  .patient-list-content-list-item-content-body-detail-label {
  color: #666;
}

.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-body
  .patient-list-content-list-item-content-body-detail
  .patient-list-content-list-item-content-body-detail-value {
  color: #333;
  font-weight: 500;
}

/* 患者卡片底部按钮 */
.patient-list-container
  .patient-Content
  .patient-list-content-list
  .patient-list-content-list-item
  .patient-list-content-list-item-content
  .patient-list-content-list-item-content-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

/* 无数据状态 */
.patient-list-container .patient-Content .patient-list-content-list-no-data {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .patient-list-container .patient-Content .patient-list-content-list {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .patient-list-container
    .patient-Content
    .patient-list-content-list
    .patient-list-content-list-item {
    padding: 12px;
  }

  .patient-list-container .patient-list-content .search-box .search-box-content .search-box-input {
    width: 200px;
    min-width: 150px;
  }
}

@media (max-width: 480px) {
  .patient-list-container .patient-list-content .search-box .search-box-content .search-box-input {
    width: 150px;
    min-width: 120px;
  }
}
</style>
