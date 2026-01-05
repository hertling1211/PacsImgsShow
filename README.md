# PacsImgShow PACS图像管理与查看工具

## 项目描述
PacsImgShow是一款基于Vue3和ElementPlus开发的PACS图像管理与查看工具，提供图像管理、查看、标注、导出等功能，支持多用户登录和Web端访问。

### 主要功能
- 图像管理：支持从PACS服务器检索图像，包括查询、检索、存储等操作
- 图像查看：提供图像查看功能，支持缩放、旋转、拖动等操作
- 图像标注：支持在图像上添加标注，包括矩形、圆形、箭头等
- 图像导出：支持将图像导出为常用格式，如JPEG、PNG等
- 在线标注：支持在图像上进行标注，标注信息可以实时同步到PACS服务器
- 多用户登录：支持多个用户同时登录，每个用户可以独立操作
- Web端访问：支持通过浏览器访问PacsImgShow，无需安装客户端

### 特性
- 跨平台：支持Windows、macOS、Linux等操作系统
- 简单易用：提供简单易用的界面，无需专业知识即可操作
- 响应式设计：使用Vue3框架开发，提供现代化响应式界面

## 技术栈
- 前端：Vue3 + ElementPlus

## 安装步骤

1. 克隆项目到本地：
```bash
git clone https://github.com/hertling1211/PacsImgsShow.git
```

2. 进入项目目录：
```bash
cd PacsImgsShow
```

3. 安装依赖：
```bash
npm install
```

4. 启动开发服务器：
```bash
npm run dev
```

5. 构建生产版本：
```bash
npm run build
```

## 使用方法

### 启动应用
```bash
# 开发模式
npm run dev

# 生产模式
# 首先构建项目
npm run build
```

### 主要操作指南
1. **图像检索**：在查询界面输入患者信息，点击检索按钮从PACS服务器获取图像
2. **图像查看**：在图像列表中选择图像，使用鼠标滚轮缩放，拖拽移动，右键菜单旋转
3. **添加标注**：切换到标注模式，选择标注工具（矩形、圆形、箭头等），在图像上绘制
4. **导出图像**：在图像查看界面点击导出按钮，选择导出格式（JPEG、PNG等）

## 示例代码

### 图像加载示例
```javascript
// 使用dicom-parser加载DICOM图像
import dicomParser from 'dicom-parser';

// 读取DICOM文件
const loadDicomFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    const dataSet = dicomParser.parseDicom(arrayBuffer);
    // 处理DICOM数据
    processDicomDataSet(dataSet);
  };
  reader.readAsArrayBuffer(file);
};
```

### 图像标注示例
```javascript
// 添加矩形标注
const addRectangleAnnotation = (imageId, position) => {
  const annotation = {
    imageId,
    type: 'rectangle',
    position,
    color: '#FF0000',
    width: 2
  };
  // 保存标注
  saveAnnotation(annotation);
};
```

## 贡献指南

1. Fork本项目
2. 创建特性分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -m 'Add new feature'`
4. 推送到分支：`git push origin feature/new-feature`
5. 提交Pull Request

### 开发规范
- 使用Vue3 Composition API
- 遵循ElementPlus组件规范
- 代码风格保持一致
- 添加必要的注释
- 提交前确保所有测试通过

## 许可证

本项目采用MIT 3.0 许可证，详细信息请查看LICENSE文件。

## 注意事项

此项目暂时为前端项目，不包含后端和数据库部分。项目正在开发中，功能随时会有更新。不作为最终产品，仅用于学习和研究。
