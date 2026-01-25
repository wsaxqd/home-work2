# 🚀 启蒙之光APP测试快速指南

> 从零开始,5步完成APP测试

## 📋 准备工作检查

### 方案A: 使用Android Studio(推荐)

#### 第一步: 安装Android Studio

1. **下载Android Studio**
   - 官网: https://developer.android.com/studio
   - 中国镜像: https://developer.android.google.cn/studio
   - 下载适合您系统的版本(Windows/Mac/Linux)

2. **安装步骤**
   ```
   1. 运行安装程序
   2. 选择 "Standard" 安装类型
   3. 等待下载Android SDK组件(需要几分钟)
   4. 完成安装
   ```

3. **首次启动配置**
   ```
   1. 打开Android Studio
   2. 会提示下载SDK组件,点击 "Next" 全部下载
   3. 创建/导入项目时选择 "Open an Existing Project"
   4. 选择: D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android
   ```

#### 第二步: 打开项目

**方式1: 通过命令行**
```bash
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app"
npx cap open android
```

**方式2: 直接在Android Studio中打开**
```
1. 打开Android Studio
2. File → Open
3. 选择: D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android
4. 等待Gradle同步完成(首次需要几分钟)
```

#### 第三步: 创建模拟器(如果没有真机)

```
1. Tools → Device Manager
2. 点击 "Create Device"
3. 选择设备: Pixel 5 (推荐)
4. 选择系统镜像: API 33 (Android 13)
5. 点击 "Finish"
```

#### 第四步: 运行APP

```
1. 在Android Studio顶部工具栏选择刚创建的模拟器
2. 点击绿色的 ▶️ Run 按钮
3. 等待模拟器启动(首次需要1-2分钟)
4. APP会自动安装并运行
```

---

### 方案B: 直接生成APK安装到真机(无需Android Studio)

如果您有Android手机,可以直接生成APK安装:

#### 第一步: 生成APK

```bash
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android"
gradlew assembleDebug
```

如果提示找不到gradlew,使用完整路径:
```bash
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android"
.\gradlew.bat assembleDebug
```

#### 第二步: 找到APK文件

APK位置:
```
D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android\app\build\outputs\apk\debug\app-debug.apk
```

#### 第三步: 安装到手机

**方式1: USB连接**
```bash
# 1. 手机开启USB调试模式
# 2. 用USB线连接电脑
# 3. 运行:
adb install "app\android\app\build\outputs\apk\debug\app-debug.apk"
```

**方式2: 文件传输**
```
1. 将APK文件传到手机(微信/QQ/云盘等)
2. 在手机上打开文件管理器
3. 点击APK文件安装
4. 允许安装未知来源应用(如果提示)
```

---

## 🎨 准备APP图标(可选,先测试功能)

### 临时方案: 使用默认图标
目前APP使用Capacitor默认图标,功能完全正常,可以先测试。

### 正式方案: 定制图标

#### 第一步: 准备图标素材

**最低要求:** 1024×1024px PNG图标

**推荐内容:**
- 简洁明了的设计
- 使用品牌色 #667eea (紫色渐变)
- 儿童友好风格
- 可以包含: 灯泡💡、星星⭐、阳光☀️等元素

**在线制作工具:**
- Canva: https://www.canva.com/ (免费模板)
- Figma: https://www.figma.com/ (专业设计)
- 或使用AI生成: Midjourney、DALL-E等

#### 第二步: 批量生成所有尺寸

使用在线工具自动生成:

**推荐工具: AppIcon.co**
```
1. 访问: https://www.appicon.co/
2. 上传1024×1024图标
3. 选择: iOS + Android
4. 点击 "Generate"
5. 下载压缩包
```

#### 第三步: 替换图标文件

**Android图标:**
```
解压后将文件复制到:
D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android\app\src\main\res\

目录结构:
mipmap-mdpi/ic_launcher.png
mipmap-hdpi/ic_launcher.png
mipmap-xhdpi/ic_launcher.png
mipmap-xxhdpi/ic_launcher.png
mipmap-xxxhdpi/ic_launcher.png
```

**iOS图标:**
```
将图标文件复制到:
D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\ios\App\App\Assets.xcassets\AppIcon.appiconset\

按照Contents.json中的要求放置对应尺寸
```

#### 第四步: 重新构建

```bash
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app"
npm run build
npx cap sync
```

然后重新运行APP查看新图标。

---

## ✅ 测试清单

### 功能测试:

- [ ] APP能正常启动
- [ ] 登录功能正常
- [ ] 首页显示正确
- [ ] AI对话功能正常
- [ ] 作业助手功能正常
- [ ] 创作工具功能正常
- [ ] 学习地图功能正常
- [ ] 宠物系统功能正常
- [ ] 图片加载正常
- [ ] 滚动流畅
- [ ] 触摸反馈流畅
- [ ] 没有明显的卡顿或崩溃

### 显示测试:

- [ ] 刘海屏/全面屏适配正常
- [ ] 底部导航不被遮挡
- [ ] 顶部标题栏显示正常
- [ ] 文字大小合适
- [ ] 按钮触摸热区足够大
- [ ] 横屏显示正常(可选)

---

## 🎯 当前建议的测试流程

### 最快测试方案:

```bash
# 1. 生成APK(无需Android Studio)
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android"
.\gradlew.bat assembleDebug

# 2. APK位置
# app\android\app\build\outputs\apk\debug\app-debug.apk

# 3. 传到Android手机安装测试
```

### 完整测试方案:

```bash
# 1. 安装Android Studio
# 从官网下载并安装

# 2. 打开项目
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app"
npx cap open android

# 3. 创建模拟器并运行
# 在Android Studio中操作
```

---

## ❓ 常见问题

### Q: gradlew命令找不到?
A: 使用完整路径:
```bash
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android"
.\gradlew.bat assembleDebug
```

### Q: Android Studio打不开项目?
A: 直接在Android Studio中:
```
File → Open → 选择 app\android 目录
```

### Q: 模拟器启动很慢?
A:
- 首次启动需要1-2分钟,正常现象
- 或直接用真机测试(更快)

### Q: APK安装提示"未知来源"?
A:
- 在手机设置中允许安装未知来源应用
- 或使用adb install命令

### Q: APP启动后是白屏?
A:
- 等待几秒,首次加载需要时间
- 检查服务器是否启动(如需连接后端)

---

## 📞 需要帮助?

如果遇到问题,请提供:
1. 具体错误信息截图
2. 使用的测试方案(Android Studio / 直接APK)
3. 设备信息(模拟器/真机型号)

参考完整文档:
- `APP_PACKAGING_GUIDE.md` - 详细打包指南
- `APP_ICONS_README.md` - 图标配置指南
- `APP_PACKAGING_SUMMARY.md` - 打包总结

---

## 🎉 开始测试!

**推荐流程:**
1. ✅ 先用方案B生成APK,快速测试功能
2. ✅ 功能正常后,准备图标素材
3. ✅ 安装Android Studio进行完整测试
4. ✅ 准备发布素材,上传应用商店

Good luck! 🚀
