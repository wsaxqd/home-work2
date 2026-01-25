# 启蒙之光 APP打包完整指南

> 从Web到iOS/Android原生应用

## 📦 打包状态

✅ **Capacitor已配置完成!**

- ✅ iOS项目已创建 (`app/ios/`)
- ✅ Android项目已创建 (`app/android/`)
- ✅ Web资源已构建 (`app/dist/`)
- ✅ 资源已同步到原生项目

**App ID:** `com.qimengzhiguang.app`
**App名称:** 启蒙之光

---

## 🚀 下一步操作

### 选项1: 使用iOS打包(需要Mac + Xcode)

#### 环境要求:
- macOS系统
- Xcode 14.0+ (从App Store免费下载)
- Apple Developer账号($99/年,用于发布到App Store)

#### 打包步骤:

```bash
# 1. 打开Xcode项目
cd app
npx cap open ios

# Xcode会自动打开,然后:
# 2. 选择模拟器或真机
# 3. 点击 ▶️ (Run) 按钮测试
# 4. Product → Archive 打包
# 5. Distribute App → App Store Connect → 上传
```

**首次配置:**
1. 在Xcode中,选择项目 → Signing & Capabilities
2. 选择Team (需要Apple Developer账号)
3. Bundle Identifier会自动填充为 `com.qimengzhiguang.app`

---

### 选项2: 使用Android打包(推荐,跨平台)

#### 环境要求:
- Android Studio (免费) - https://developer.android.com/studio
- JDK 17+ (Android Studio会提示安装)

#### 打包步骤:

```bash
# 1. 打开Android Studio项目
cd app
npx cap open android

# Android Studio打开后:
# 2. Build → Generate Signed Bundle / APK
# 3. 选择 APK (测试) 或 AAB (发布)
# 4. 创建签名密钥(首次需要)
# 5. 选择 release 构建
# 6. 生成的APK/AAB在 android/app/build/outputs/
```

**生成测试APK(无签名):**
```bash
cd app/android
./gradlew assembleDebug

# APK位置: android/app/build/outputs/apk/debug/app-debug.apk
# 可直接安装到Android设备测试
```

**生成发布APK(需签名):**
```bash
cd app/android
./gradlew assembleRelease

# 首次需要创建签名密钥(见下文)
```

---

## 🔑 Android签名配置

### 1. 生成签名密钥

```bash
# 在 app/android 目录下执行
keytool -genkey -v -keystore qmzg-release.keystore \
  -alias qmzg -keyalg RSA -keysize 2048 -validity 10000

# 会提示输入:
# - 密钥库密码(记住,发布时需要)
# - 别名密码
# - 姓名、组织等信息
```

### 2. 配置Gradle签名

创建 `app/android/key.properties`:
```properties
storeFile=qmzg-release.keystore
storePassword=你的密钥库密码
keyAlias=qmzg
keyPassword=你的别名密码
```

修改 `app/android/app/build.gradle`:
```gradle
// 在android块之前添加
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**⚠️ 重要:** 将 `key.properties` 和 `*.keystore` 添加到 `.gitignore`,防止泄露!

---

## 🔄 日常开发流程

### 1. 修改代码后重新打包

```bash
cd app

# 1. 构建Web资源
npm run build

# 2. 同步到原生项目
npx cap sync

# 3. 打开IDE测试
npx cap open ios    # 或
npx cap open android
```

### 2. 快速测试命令

```bash
# Android快速测试
cd app
npm run build && npx cap sync && npx cap run android

# iOS快速测试(需要Mac)
cd app
npm run build && npx cap sync && npx cap run ios
```

### 3. 添加到package.json

在 `app/package.json` 的 `scripts` 中添加:
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "cap:sync": "npm run build && npx cap sync",
    "cap:ios": "npm run cap:sync && npx cap open ios",
    "cap:android": "npm run cap:sync && npx cap open android",
    "cap:run:android": "npm run cap:sync && npx cap run android",
    "cap:run:ios": "npm run cap:sync && npx cap run ios"
  }
}
```

然后可以使用:
```bash
npm run cap:android  # 构建+打开Android Studio
npm run cap:ios      # 构建+打开Xcode
```

---

## 📱 测试APP

### iOS测试:
1. **模拟器测试:** Xcode → 选择模拟器 → Run
2. **真机测试:** 连接iPhone → 选择设备 → Run (需要开发者账号)

### Android测试:
1. **模拟器测试:** Android Studio → AVD Manager → 创建/启动模拟器 → Run
2. **真机测试:**
   ```bash
   # 1. 手机开启USB调试
   # 2. 连接电脑
   # 3. 安装APK
   adb install app/android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 🎨 自定义配置

### 修改APP信息

编辑 `app/capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.qimengzhiguang.app',    // Bundle ID
  appName: '启蒙之光',                 // APP名称
  webDir: 'dist',

  // 启动画面配置
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,      // 显示时长
      backgroundColor: "#667eea",     // 背景色
      launchAutoHide: true,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',                  // 状态栏样式
      backgroundColor: '#667eea'      // Android状态栏背景色
    }
  }
};
```

### 修改后同步:
```bash
npx cap sync
```

---

## 📤 发布到应用商店

### iOS - App Store

1. **准备工作:**
   - Apple Developer账号($99/年)
   - 准备应用截图(所需尺寸见Apple文档)
   - 准备应用描述、关键词等

2. **提交流程:**
   ```bash
   # 1. 在Xcode中打包
   Product → Archive

   # 2. 上传到App Store Connect
   Distribute App → App Store Connect

   # 3. 在App Store Connect填写信息
   # - https://appstoreconnect.apple.com
   # - 创建App → 填写元数据 → 提交审核
   ```

3. **审核时间:** 通常1-7天

### Android - Google Play

1. **准备工作:**
   - Google Play开发者账号($25一次性)
   - 准备应用截图
   - 准备隐私政策链接(必须)

2. **提交流程:**
   ```bash
   # 1. 生成签名的AAB文件
   cd app/android
   ./gradlew bundleRelease

   # 2. 上传到Google Play Console
   # - https://play.google.com/console
   # - 创建应用 → 上传AAB → 填写信息 → 提交审核
   ```

3. **审核时间:** 通常1-3天

---

## 🛠️ 常见问题

### Q: iOS构建失败 - "No Provisioning Profile"
A: 需要在Xcode中配置Team和Signing。选择项目 → Signing & Capabilities → Team。

### Q: Android构建失败 - "SDK not found"
A: 在Android Studio中打开项目,会自动提示安装缺少的SDK组件。

### Q: 修改代码后APP没有更新?
A: 确保运行了 `npm run build && npx cap sync`。

### Q: 如何调试APP?
A:
- iOS: Xcode → Debug → Attach to Process
- Android: Android Studio → Logcat 查看日志
- 或在浏览器中使用Chrome DevTools远程调试

### Q: 打包体积太大?
A:
- 优化图片资源
- 使用代码分割 (Vite已支持)
- 移除未使用的依赖

### Q: 如何更新已发布的APP?
A:
1. 修改代码
2. 增加版本号 (package.json的version字段)
3. 重新构建和打包
4. 提交新版本到应用商店

---

## 📚 参考资源

- **Capacitor官方文档:** https://capacitorjs.com/docs
- **iOS开发指南:** https://developer.apple.com/documentation/
- **Android开发指南:** https://developer.android.com/docs
- **App Store审核指南:** https://developer.apple.com/app-store/review/guidelines/
- **Google Play政策:** https://play.google.com/about/developer-content-policy/

---

## ✅ 检查清单

### 打包前:
- [ ] 确认所有功能正常
- [ ] 准备APP图标(见 `APP_ICONS_README.md`)
- [ ] 准备启动画面
- [ ] 测试在多个设备上的显示效果
- [ ] 确认服务器API地址正确
- [ ] 准备应用商店素材(截图、描述等)

### iOS发布前:
- [ ] Apple Developer账号已激活
- [ ] Bundle ID已注册
- [ ] 证书和Provisioning Profile已配置
- [ ] App Store Connect中应用已创建
- [ ] 准备隐私政策链接

### Android发布前:
- [ ] Google Play开发者账号已激活
- [ ] 签名密钥已生成并安全保存
- [ ] 准备隐私政策链接(必须)
- [ ] 测试APK在真机上运行正常

---

## 🎉 恭喜!

您的"启蒙之光"APP已成功打包!现在可以:

1. **在模拟器/真机上测试**
2. **继续开发新功能**
3. **准备发布到应用商店**

有任何问题,请参考上述文档或Capacitor官方文档。
