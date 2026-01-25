# 🚀 Android Studio 安装和测试 - 分步指南

> 跟着这个文档操作,30分钟完成APP测试

## 📥 第一步: 下载Android Studio

### Windows用户:

**方式1: 官方下载(推荐)**
```
直接访问: https://developer.android.com/studio

或使用国内镜像(更快):
https://developer.android.google.cn/studio
```

**方式2: 直接下载链接**
```
最新版本(2024.2.1):
https://redirector.gvt1.com/edgedl/android/studio/install/2024.2.1.11/android-studio-2024.2.1.11-windows.exe

文件大小: 约1.1GB
下载时间: 5-15分钟(取决于网速)
```

**方式3: 国内镜像(网速慢时使用)**
```
清华大学镜像:
https://mirrors.tuna.tsinghua.edu.cn/android-studio/

选择最新的 .exe 文件下载
```

### 下载完成后:
- ✅ 文件名: `android-studio-xxxx-windows.exe`
- ✅ 大小: 约1GB+
- ✅ 保存位置: 记住位置,待会要安装

---

## 💻 第二步: 安装Android Studio

### 详细安装步骤:

#### 1. 启动安装程序
```
双击下载的 android-studio-xxxx-windows.exe
如果提示"是否允许此应用对你的设备进行更改",点击"是"
```

#### 2. 欢迎界面
```
Welcome to Android Studio Setup
点击 [Next >]
```

#### 3. 选择组件
```
Choose Components
✅ Android Studio (必选,已勾选)
✅ Android Virtual Device (推荐勾选,用于模拟器)

点击 [Next >]
```

#### 4. 许可协议
```
License Agreement
点击 [I Agree]
```

#### 5. 选择安装位置
```
Configuration Settings
Install Location: C:\Program Files\Android\Android Studio (默认即可)
Android SDK Location: C:\Users\你的用户名\AppData\Local\Android\Sdk (默认即可)

点击 [Next >]
```

#### 6. 开始菜单文件夹
```
Choose Start Menu Folder
保持默认: Android Studio

点击 [Install]
```

#### 7. 等待安装
```
Installing
显示进度条,等待2-5分钟
- Extracting files...
- Installing Android Studio...
- Creating shortcuts...
```

#### 8. 安装完成
```
Completing Android Studio Setup
✅ Start Android Studio (勾选)

点击 [Finish]
```

---

## 🎨 第三步: 首次配置Android Studio

### 安装完成后会自动启动配置向导:

#### 1. 导入设置
```
Import Android Studio Settings
选择: Do not import settings (不导入设置)

点击 [OK]
```

#### 2. 欢迎界面
```
Welcome
点击 [Next]
```

#### 3. 安装类型
```
Install Type
⭐ 选择: Standard (推荐)
   这会自动安装所有必需组件,包括:
   - Android SDK
   - Android SDK Platform
   - Performance (Intel HAXM)
   - Android Virtual Device

点击 [Next]
```

#### 4. 选择主题
```
Select UI Theme
○ Darcula (暗色主题)
● Light (亮色主题)

选择你喜欢的,点击 [Next]
```

#### 5. 验证设置
```
Verify Settings
检查即将下载的组件:

SDK Components to Download:
- Android SDK Platform 34
- Android SDK Build-Tools
- Android Emulator
- Android SDK Platform-Tools
等等...

总下载大小: 约2-3GB

点击 [Next]
```

#### 6. 许可协议
```
License Agreement
需要接受所有许可:

android-sdk-license: ○ Accept
intel-android-extra-license: ○ Accept
...

全部选择 Accept,然后点击 [Finish]
```

#### 7. 下载组件(重要)
```
Downloading Components
显示下载进度:
- Downloading Android SDK Platform 34...
- Downloading Android Emulator...
- Downloading Build-Tools...

⏱️ 这一步需要10-30分钟,取决于网速
📊 下载大小: 约2-3GB

请耐心等待,不要关闭!
```

#### 8. 完成配置
```
Android Studio Setup Wizard - Finished
显示: Setup Wizard finished successfully

点击 [Finish]
```

---

## 📂 第四步: 打开项目

### 进入Android Studio主界面:

#### 1. 欢迎屏幕
```
Welcome to Android Studio

你会看到:
- New Project (新建项目)
- Open (打开现有项目) ← 选择这个!
- Get from VCS (从版本控制获取)
```

#### 2. 打开项目
```
点击 [Open]

浏览到:
D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android

选择 android 文件夹,点击 [OK]
```

#### 3. 信任项目
```
Trust and Open Project 'android'?
这个项目包含构建脚本,可能会执行代码

点击 [Trust Project]
```

#### 4. Gradle同步(自动开始)
```
底部会显示:
⏳ Gradle sync in progress...

进度显示:
- Configuring project...
- Resolving dependencies...
- Downloading dependencies...

⏱️ 首次同步需要2-10分钟
```

#### 5. 等待同步完成
```
同步成功后会显示:
✅ Gradle sync finished in XXs

如果出现错误,检查:
- 网络连接是否正常
- 点击 "Try Again" 重试
```

---

## 📱 第五步: 创建模拟器

### 创建Android虚拟设备:

#### 1. 打开Device Manager
```
方式1: 顶部工具栏 → Tools → Device Manager
方式2: 右侧边栏 → Device Manager 图标 📱
```

#### 2. 创建新设备
```
Device Manager 窗口
点击 [Create Device] 按钮
```

#### 3. 选择硬件
```
Select Hardware

Category: Phone (选择手机)

设备列表:
推荐选择: Pixel 5
- 屏幕: 6.0", 1080×2340
- 主流尺寸,兼容性好

选中后点击 [Next]
```

#### 4. 选择系统镜像
```
System Image

Release Name 选择:
⭐ Tiramisu (API Level 33, Android 13) - 推荐
   Target: Android 13.0 (Google APIs)

如果没有下载,会显示 [Download] 链接:
- 点击 Download
- 等待下载(约700MB, 需5-10分钟)
- 下载完成后自动勾选

点击 [Next]
```

#### 5. 验证配置
```
Android Virtual Device (AVD)

AVD Name: Pixel_5_API_33 (可以改名)

显示配置:
- Device: Pixel 5
- System Image: API 33 Android 13.0
- RAM: 2048 MB
- Storage: 2048 MB

点击 [Finish]
```

#### 6. 模拟器创建成功
```
Device Manager 中显示:
✅ Pixel_5_API_33
   Android 13.0 | x86_64

状态: Available
```

---

## ▶️ 第六步: 运行APP

### 在模拟器中测试APP:

#### 1. 选择运行设备
```
顶部工具栏:
┌─────────────────────────────┐
│ app ▼ │ Pixel_5_API_33 ▼ │ ▶️ │
└─────────────────────────────┘

确保选择: Pixel_5_API_33
```

#### 2. 点击运行按钮
```
点击绿色的 ▶️ Run 'app' 按钮

或使用快捷键: Shift + F10
```

#### 3. 等待模拟器启动
```
⏳ 首次启动模拟器需要1-3分钟

会看到:
1. Android logo 启动画面
2. "Android" 文字动画
3. 系统初始化
4. 进入主屏幕
```

#### 4. APP自动安装
```
模拟器启动后:
1. Android Studio 自动编译APP (30秒-1分钟)
2. 自动安装到模拟器
3. 自动启动APP

底部 Run 窗口显示:
✅ Installing APKs...
✅ Launching 'com.qimengzhiguang.app'
✅ App launched successfully
```

#### 5. 🎉 启蒙之光APP运行!
```
模拟器中会显示:
- APP启动画面(紫色背景 #667eea)
- 进入主界面
- 可以正常操作
```

---

## 📦 第七步: 生成APK文件

### 构建安装包:

#### 1. 开始构建
```
顶部菜单:
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

#### 2. 等待构建
```
底部 Build 窗口显示:
⏳ Building APK...
- Executing tasks...
- Running compilation...
- Packaging APK...

⏱️ 约需30秒-2分钟
```

#### 3. 构建完成
```
右下角弹出通知:
✅ APK(s) generated successfully

通知中有两个链接:
- locate (找到APK位置)
- analyze (分析APK)

点击 [locate]
```

#### 4. 找到APK文件
```
文件资源管理器自动打开:
D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android\app\build\outputs\apk\debug\

文件: app-debug.apk
大小: 约40-60MB
```

---

## 📲 第八步: 安装到真机

### 将APK传到Android手机:

#### 方式1: USB传输(最快)
```
1. 用USB线连接手机到电脑
2. 手机选择"文件传输"模式
3. 复制 app-debug.apk 到手机
4. 在手机上找到文件,点击安装
```

#### 方式2: 微信/QQ传输
```
1. 将 app-debug.apk 通过微信发给自己
   (或传到"文件传输助手")
2. 在手机上接收文件
3. 点击文件,选择"用其他应用打开"
4. 选择"安装"
```

#### 方式3: 云盘传输
```
1. 上传 app-debug.apk 到网盘(百度云/阿里云等)
2. 在手机上下载
3. 安装
```

### 安装步骤:
```
1. 点击 app-debug.apk
2. 如果提示"未知来源":
   → 设置 → 安全 → 允许安装未知应用
3. 点击"安装"
4. 安装完成后点击"打开"
5. 🎉 启蒙之光APP运行!
```

---

## ✅ 完成检查清单

### Android Studio安装:
- [ ] Android Studio已下载
- [ ] Android Studio已安装
- [ ] SDK组件已下载完成
- [ ] 配置向导已完成

### 项目配置:
- [ ] 项目已打开
- [ ] Gradle同步成功
- [ ] 没有错误提示

### 模拟器:
- [ ] 模拟器已创建
- [ ] 模拟器能正常启动
- [ ] APP在模拟器中运行正常

### APK生成:
- [ ] APK构建成功
- [ ] 找到APK文件
- [ ] APK能在真机上安装运行

---

## ❓ 常见问题解决

### Q1: SDK下载很慢或失败
```
解决方法:
1. Settings → Appearance & Behavior → System Settings → HTTP Proxy
2. 选择 "Manual proxy configuration"
3. 或使用国内镜像源
```

### Q2: Gradle同步失败
```
错误: Could not resolve dependencies

解决方法:
1. File → Settings → Build Tools → Gradle
2. Gradle JDK: 选择 "Embedded JDK"
3. 点击工具栏的 🐘 (Sync Project with Gradle Files)
4. 或 Build → Clean Project, 然后 Rebuild
```

### Q3: 模拟器启动黑屏
```
解决方法:
1. 在BIOS中启用虚拟化技术:
   - Intel: VT-x
   - AMD: AMD-V
2. 或使用真机测试
```

### Q4: APP运行报错
```
错误: Installation failed

解决方法:
1. Build → Clean Project
2. Build → Rebuild Project
3. 重新运行
```

### Q5: 模拟器太慢
```
解决方法:
1. 增加模拟器RAM:
   - Device Manager → 编辑设备 → Advanced Settings
   - RAM: 改为 4096 MB
2. 或使用真机测试(更快)
```

---

## 🎯 下一步

### 测试完成后:

1. **测试所有功能**
   - 登录/注册
   - AI对话
   - 作业助手
   - 创作工具
   - 学习地图
   - 宠物系统

2. **准备APP图标**
   - 参考 `APP_ICONS_README.md`
   - 使用 https://www.appicon.co/ 生成

3. **生成正式版APK**
   - 配置签名
   - Build → Generate Signed Bundle / APK
   - 参考 `APP_PACKAGING_GUIDE.md`

4. **发布到应用商店**
   - Google Play Console
   - 准备素材和描述

---

## 📞 需要帮助?

遇到问题时:
1. 查看错误信息截图
2. 检查上面的常见问题
3. 参考完整文档:
   - `APP_PACKAGING_GUIDE.md`
   - `TESTING_OPTIONS.md`

---

## 🎉 恭喜!

如果您完成了所有步骤,您现在已经:
- ✅ 安装了Android开发环境
- ✅ 成功运行了启蒙之光APP
- ✅ 生成了APK安装包
- ✅ 可以在真机上测试

**下一步就是完善APP并发布上线了!** 🚀
