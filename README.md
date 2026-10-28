# Dota Lens

> 本仓库 Fork 自原作者 [Kerry-yangg](https://github.com/Kerry-yangg) 的
> [Dota Lens](https://github.com/Kerry-yangg/Dotalens)。上游地址：
> https://github.com/Kerry-yangg/Dotalens

面向 Dota 2 玩家的一体化本地 Replay 复盘工具。本 Fork 当前可构建的代码基线为
`v0.5.1`，并提供 Apple Silicon macOS 客户端适配；分析结论用于辅助复盘，不应视为绝对的游戏判断。

[下载 Windows x64 安装包（上游）](https://github.com/Kerry-yangg/Dotalens/releases/latest) · [下载 macOS Apple Silicon 安装包（本 Fork）](https://github.com/ore4o/Dotalens/releases/latest)

Dota Lens 可以通过 Dota 2 游戏数字 ID 读取公开比赛，也支持手动导入本地 Replay。录像会在本机解析，并生成对线、发育、团战、视野、出装和逐玩家报告。

## 上游发布与源码同步状态

截至 2026-10-28，上游最新 Windows Release 是 [v0.6.1](https://github.com/Kerry-yangg/Dotalens/releases/tag/v0.6.1)。本 Fork 已同步上游公开主分支的全部提交，包括 CHANGELOG 和 [v0.5.9 发布说明](docs/releases/v0.5.9.md)。

**注意：** 上游新版核心源码未公开，最近公开的提交仅包含发布文档。因此以下新版功能为上游 Windows 安装版的说明，不代表本 Fork 的 macOS 客户端已具备这些功能；本 Fork 可构建的代码基线仍为 `v0.5.1`。

### 上游 v0.5.9 重点更新

- **本机报告更容易打开**：比赛页、Replay 列表和已完成任务可直接打开保存的报告，无需先连接账号；首次使用提供游戏 ID、导入录像和本机报告三个入口。
- **本局总结优先**：打开比赛先看本局总结，再按需进入深度分析和分析思路；从结果回查前序交战、死亡状态和对应证据。
- **团战与开团前视野**：整场个人团战报告结合十人生命、魔法和状态；可切换天辉、夜魇、上帝视角，并定位开团前 10 秒、前 5 秒或交战开始。
- **证据往返更稳定**：查看片段后返回报告可保留页签、筛选和阅读位置；修复首次跳转被异步加载重置及播放过程中地图、时间条跳动的问题。
- **结论与数字更清楚**：简明模式优先显示游戏事实；本路结果与个人执行分开呈现，统一跨局统计口径、单位和缺失数据说明。
- **分享与失败恢复**：补齐报告读取重试入口，修复 PNG 导出和 HTML 分享中英雄图片缺失。

上游该安装版的客户端版本为 `0.5.9`，内置 Parser API 为 `1.16.0`。完整说明见 [v0.5.9 Release](https://github.com/Kerry-yangg/Dotalens/releases/tag/v0.5.9)。

## 主要功能

- 通过 Dota 2 游戏数字 ID 读取公开比赛，展示胜负、KDA、补刀、反补、GPM 和 XPM。
- 自动获取公开 Replay，完成下载、解压、本地解析和紧凑分析包生成。
- 手动导入 `.dem` 或 `.dem.bz2` Replay，高分对局和公开服务缺失的录像也可分析。
- 提供比赛总览、对线复盘、打钱分析、地图轨迹、视野分析、出装技能、战斗团战、玩家评分和玩家对比。
- 查看英雄位置、经济、经验、物品、技能、击杀、眼位及关键事件时间轴。
- 结论支持跳转到对应时间和地图位置，并区分事实、程序推导、置信度与数据局限。
- 支持解析进度、取消、超时提示、失败原因、重试和本地任务历史。

## 安装使用

### Windows

Windows 10/11 x64 用户可使用上游提供的安装程序：

1. 从[上游最新 Release](https://github.com/Kerry-yangg/Dotalens/releases/latest) 下载 Windows x64 安装包，并参照同一发布页的 `SHA256SUMS.txt` 核对校验值。
2. 运行安装程序并选择安装目录。
3. 启动 Dota Lens，输入 Dota 2 个人资料中显示的游戏数字 ID。
4. 从比赛列表选择一场比赛，确认后等待本地解析完成。

### macOS Apple Silicon（M1/M2/M3/M4）

从[本 Fork 的最新 Release](https://github.com/ore4o/Dotalens/releases/latest) 下载 DMG，打开后将 `Dota Lens.app` 拖入“应用程序”。

macOS 安装版会在“设置 → 更新”中检查本 Fork 的 GitHub Release。发现新版后，点击“在浏览器下载”，再退出 Dota Lens 并将新版 App 拖入“应用程序”替换旧版。

当前安装包未使用 Apple Developer ID 签名和公证，因此不采用静默下载与自动替换；首次打开可能需要按 macOS 的安全提示手动确认。

## 高分对局与本地 Replay

部分高分 Immortal Draft 对局不会出现在公开比赛历史中，公开服务也可能拿不到 Replay 地址。这不代表录像无法分析：

1. 在 Dota 2 客户端的比赛历史中下载自己的 Replay。
2. 在 Dota Lens 中选择“导入 Replay”，或者在设置中选择 Replay 目录后扫描。
3. 导入对应的 `.dem` 或 `.dem.bz2` 文件并等待解析。

Dota Lens 会从 Replay 重建比赛 ID、胜负、时长、十名玩家、英雄和基础事件，再生成现有分析模块。非参赛者通常无法通过公共接口下载这类 Replay。

## 数据与隐私

- 比赛列表查询会请求 OpenDota 等公开服务。
- 公开 Replay 会从公开服务提供的 Valve Replay 地址下载。
- 手动导入的 Replay、解析事件、分析结果和本机学习样本默认只保存在本机。
- Dota Lens 不会把本地 Replay 或完整分析报告上传到自有服务器。
- 外部公开服务适用其各自的隐私政策与服务条款。

## 数据局限

- Dota 2 Patch、地图和 Replay 字段会持续变化，部分推导需要随版本校准。
- 证据不足时，客户端会降低结论置信度或明确提示无法判断，而不是用缺失数据批评玩家。
- macOS 构建需要在目标架构的 Mac 上完成，才能把匹配架构的精简 Java 运行时打入应用。

## macOS 构建

在 macOS 上安装 JDK 21（必须包含 `jlink`）、Maven 3.9+ 和 Node.js 22.12+ 后：

```bash
npm ci
npm run parser:build:mac
npm run runtime:build:mac
npm run desktop:dist:mac
```

产物位于 `release/`，包含 `.dmg` 与 `.zip`。开发运行可使用：

```bash
./tools/Start-DotaLens.sh
```

如 JDK 21 未被系统自动发现，运行前设置 `DOTA_LENS_JAVA_HOME` 为 JDK 根目录。

## 许可与声明

项目自有源代码采用 [MIT License](LICENSE)。OpenDota Parser、Clarity、前端依赖以及 Dota 2 名称、地图、英雄、物品和技能资源具有各自的版权与许可，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

Dota Lens 是非官方社区项目，与 Valve、完美世界或 OpenDota 无隶属、授权或背书关系。Dota 2 是 Valve Corporation 的商标。
