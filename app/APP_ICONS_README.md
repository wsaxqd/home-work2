# APP图标和启动画面设置指南

> 启蒙之光 - AI儿童创作平台

## 📱 APP图标要求

### iOS图标规格

需要准备以下尺寸的PNG图标(无圆角,系统会自动添加):

| 尺寸 | 用途 | 文件名 |
|------|------|--------|
| 1024×1024 | App Store | AppIcon-1024.png |
| 180×180 | iPhone (3x) | AppIcon-180.png |
| 120×120 | iPhone (2x) | AppIcon-120.png |
| 167×167 | iPad Pro | AppIcon-167.png |
| 152×152 | iPad | AppIcon-152.png |
| 76×76 | iPad | AppIcon-76.png |
| 40×40 | Spotlight | AppIcon-40.png |
| 29×29 | Settings | AppIcon-29.png |

**图标位置:** `app/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**生成方法:**
1. 使用在线工具: https://www.appicon.co/ (上传1024×1024图标自动生成)
2. 或使用设计软件手动导出所有尺寸

---

### Android图标规格

需要准备以下尺寸的PNG图标:

| 密度 | 尺寸 | 路径 |
|------|------|------|
| mdpi | 48×48 | `android/app/src/main/res/mipmap-mdpi/` |
| hdpi | 72×72 | `android/app/src/main/res/mipmap-hdpi/` |
| xhdpi | 96×96 | `android/app/src/main/res/mipmap-xhdpi/` |
| xxhdpi | 144×144 | `android/app/src/main/res/mipmap-xxhdpi/` |
| xxxhdpi | 192×192 | `android/app/src/main/res/mipmap-xxxhdpi/` |
| Play Store | 512×512 | 用于应用商店 |

**文件名:** `ic_launcher.png` 和 `ic_launcher_round.png` (圆形图标)

**生成方法:**
1. 使用Android Studio: 右键 `res` → New → Image Asset
2. 或使用在线工具: https://romannurik.github.io/AndroidAssetStudio/

---

## 🌟 启动画面(Splash Screen)

### iOS启动画面

**文件位置:** `app/ios/App/App/Assets.xcassets/Splash.imageset/`

**推荐尺寸:**
- 2732×2732px (适配所有iOS设备)
- 格式: PNG
- 背景色: #667eea (主题色)

**设置步骤:**
1. 准备启动画面图片
2. 在Xcode中打开项目: `npx cap open ios`
3. 选择 `Assets.xcassets` → `Splash`
4. 拖拽图片到对应位置

---

### Android启动画面

**文件位置:** `app/android/app/src/main/res/drawable/`

**推荐设置:**

1. **方式一:使用纯色背景(简单)**

编辑 `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.NoActionBar">
    <item name="android:windowBackground">@color/splash_background</item>
</style>
```

在 `android/app/src/main/res/values/colors.xml`:
```xml
<color name="splash_background">#667eea</color>
```

2. **方式二:使用图片(推荐)**

创建 `android/app/src/main/res/drawable/splash.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_image"/>
    </item>
</layer-list>
```

准备图片:
- `splash_image.png` (1080×1920px)
- 放到 `android/app/src/main/res/drawable/`

---

## 🎨 推荐设计规范

### 图标设计要点:

1. **简洁明了** - 图标应该在小尺寸下也能清晰识别
2. **统一配色** - 使用品牌主题色 #667eea
3. **儿童友好** - 可爱、明亮的设计风格
4. **无文字** - 避免在图标中使用文字(除非是Logo)

### 建议图标内容:

- 使用"启蒙之光"相关的视觉元素
- 可以考虑:灯泡💡、星星⭐、太阳☀️等启蒙相关元素
- 配合儿童友好的圆润设计

---

## 🛠️ 快速生成工具

### 方式1: 在线工具(推荐)

1. **AppIcon.co** - https://www.appicon.co/
   - 上传1024×1024图标
   - 自动生成iOS和Android所有尺寸
   - 下载压缩包,解压到对应目录

2. **MakeAppIcon** - https://makeappicon.com/
   - 同样支持批量生成
   - 提供预览功能

### 方式2: Figma模板

使用Capacitor官方Figma模板:
https://www.figma.com/community/file/1219505802942337989

---

## 📋 配置检查清单

### iOS:
- [ ] 准备1024×1024 App Store图标
- [ ] 生成所有iOS尺寸图标
- [ ] 放入 `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- [ ] 添加启动画面到 `Splash.imageset/`
- [ ] 在Xcode中验证

### Android:
- [ ] 生成所有Android密度图标
- [ ] 放入对应 `mipmap-*/` 目录
- [ ] 创建圆形图标 `ic_launcher_round.png`
- [ ] 配置启动画面
- [ ] 在Android Studio中验证

---

## 🎯 快速开始

如果您暂时没有图标,可以使用占位图标:

```bash
# 使用Capacitor默认图标(已自动生成)
# iOS和Android都会使用默认的Capacitor图标

# 后续替换时,只需:
# 1. 准备图标素材
# 2. 使用上述在线工具生成
# 3. 替换到对应目录
# 4. 重新构建APP
```

---

## 💡 提示

1. **先测试后美化** - 可以先使用默认图标进行功能测试
2. **保留原图** - 始终保留1024×1024的原始图标,方便后续调整
3. **统一风格** - 图标和启动画面应保持视觉一致性
4. **测试多设备** - 在不同尺寸设备上测试图标显示效果

---

## 📞 需要帮助?

- Capacitor图标文档: https://capacitorjs.com/docs/guides/splash-screens-and-icons
- iOS HIG图标规范: https://developer.apple.com/design/human-interface-guidelines/app-icons
- Android图标规范: https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher
