# 📱 启蒙之光APP测试 - 快速参考卡

## 🚀 30分钟完成流程

```
下载Android Studio (15分钟)
    ↓
安装并配置 (10分钟)
    ↓
打开项目 (2分钟)
    ↓
创建模拟器 (2分钟)
    ↓
运行APP (1分钟)
    ↓
✅ 测试成功!
```

---

## 📥 第一步: 下载 (5-15分钟)

### 下载链接(选一个):

**官方(国际):**
https://developer.android.com/studio

**官方(中国):**
https://developer.android.google.cn/studio

**直接下载:**
https://redirector.gvt1.com/edgedl/android/studio/install/2024.2.1.11/android-studio-2024.2.1.11-windows.exe

**国内镜像:**
https://mirrors.tuna.tsinghua.edu.cn/android-studio/

---

## 💻 第二步: 安装 (5分钟)

```
1. 双击 android-studio-xxx.exe
2. Next → I Agree → Next → Install
3. ✅ 勾选 "Start Android Studio"
4. Finish
```

---

## ⚙️ 第三步: 首次配置 (10-30分钟)

```
1. Do not import settings → OK
2. Next
3. 选择 Standard → Next
4. 选择主题 → Next
5. Next
6. 全部 Accept → Finish
7. ⏱️ 等待下载SDK (2-3GB, 10-30分钟)
8. Finish
```

**关键:** 不要关闭,耐心等待SDK下载完成!

---

## 📂 第四步: 打开项目 (2分钟)

```
1. Welcome界面 → 点击 Open
2. 浏览到: D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\app\android
3. 选择 android 文件夹 → OK
4. Trust Project
5. ⏱️ 等待Gradle同步 (2-5分钟)
6. ✅ 同步完成
```

---

## 📱 第五步: 创建模拟器 (2分钟)

```
1. Tools → Device Manager
2. Create Device
3. 选择 Pixel 5 → Next
4. 选择 Tiramisu API 33 (如未下载,点Download等待)
5. Next → Finish
6. ✅ 模拟器创建成功
```

---

## ▶️ 第六步: 运行APP (1-3分钟)

```
1. 顶部选择: Pixel_5_API_33
2. 点击绿色 ▶️ 按钮
3. ⏱️ 等待模拟器启动 (首次1-3分钟)
4. ⏱️ APP自动编译安装 (30秒)
5. 🎉 APP运行成功!
```

---

## 📦 第七步: 生成APK (可选, 2分钟)

```
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. ⏱️ 等待构建 (30秒-2分钟)
3. 点击通知中的 "locate"
4. ✅ 找到APK: app\build\outputs\apk\debug\app-debug.apk
```

### 安装到真机:
```
1. 将APK传到Android手机(微信/USB)
2. 点击安装
3. 允许"未知来源"
4. 🎉 安装成功!
```

---

## ⚡ 快捷键

| 操作 | 快捷键 |
|-----|--------|
| 运行APP | Shift + F10 |
| 停止运行 | Ctrl + F2 |
| 清理项目 | Build → Clean Project |
| 重建项目 | Build → Rebuild Project |
| 同步Gradle | Ctrl + Shift + O |

---

## ❓ 遇到问题?

### 下载慢?
→ 使用国内镜像: https://mirrors.tuna.tsinghua.edu.cn/android-studio/

### Gradle同步失败?
→ File → Settings → Gradle → 选择 "Embedded JDK"

### 模拟器黑屏?
→ BIOS启用虚拟化(VT-x/AMD-V) 或使用真机

### APP运行错误?
→ Build → Clean Project → Rebuild Project

---

## 📚 完整文档

需要详细步骤? 查看:
- **ANDROID_STUDIO_STEP_BY_STEP.md** - 分步详解
- **TESTING_OPTIONS.md** - 多种测试方案
- **APP_PACKAGING_GUIDE.md** - 完整打包教程

---

## ✅ 检查清单

安装完成:
- [ ] Android Studio已安装
- [ ] SDK组件已下载

项目配置:
- [ ] 项目已打开
- [ ] Gradle同步成功

测试运行:
- [ ] 模拟器已创建
- [ ] APP运行成功

生成APK:
- [ ] APK已生成
- [ ] 可在真机安装

---

## 🎯 预计耗时

| 步骤 | 时间 |
|-----|------|
| 下载Android Studio | 5-15分钟 |
| 安装 | 5分钟 |
| SDK下载配置 | 10-30分钟 |
| 打开项目 | 2分钟 |
| 创建模拟器 | 2分钟 |
| 运行测试 | 1-3分钟 |
| **总计** | **30-60分钟** |

**首次配置需要下载约3-4GB数据,请确保网络畅通!**

---

## 🎉 成功标志

看到这些说明成功了:
- ✅ Android Studio启动正常
- ✅ 项目打开无错误
- ✅ 模拟器能启动
- ✅ APP在模拟器中运行
- ✅ 生成了APK文件
- ✅ APK能在真机安装

**恭喜!启蒙之光APP测试成功!** 🚀

---

## 📞 需要帮助?

详细教程: `ANDROID_STUDIO_STEP_BY_STEP.md`
常见问题: `TESTING_OPTIONS.md`
打包指南: `APP_PACKAGING_GUIDE.md`
