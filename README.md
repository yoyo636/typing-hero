# 打字小英雄 ⌨️

面向小学生的打字练习网站：**8 章 63 课**循序渐进的课程、智能错词特训、实时对战、班级排行榜、教师后台、可打印的成绩单，以及一键启动的 `dazi` 命令。

- **纯前端**：无框架、无构建，双击 `index.html` 也能离线单机使用
- **零依赖后端**：只用 Node 标准库（http / crypto / zlib / vm），数据存 JSON 文件
- **一键启动**：终端输入 `dazi` 即启动服务并打开浏览器；`dazi lan` 让全班一起用

---

## 快速开始

```bash
bash install.sh   # 安装 dazi 命令（一次即可，装到 ~/.local/bin 并写入 PATH）
dazi              # 启动并自动打开浏览器
```

| 命令 | 作用 |
| --- | --- |
| `dazi` | 启动服务 + 打开浏览器（Ctrl+C 只退出日志，服务继续后台运行） |
| `dazi lan` | 局域网模式，打印 `http://192.168.x.x:5173` 给同学/平板 |
| `dazi stop` / `restart` / `status` | 停止 / 重启 / 查看状态 |
| `dazi open` / `log` / `info` | 打开网页 / 看日志 / 看网址与教师口令 |
| `dazi backup` | 备份学生数据到 `~/dazi-backups` |
| `dazi doctor` | 自检：node、端口、数据目录、备份、日志异常 |
| `dazi autostart [on\|off]` | 开机自启（macOS launchd / Linux systemd user） |

默认端口 `5173`，被占用自动顺延；可用 `--port N --host 0.0.0.0` 或环境变量 `DAZI_PORT`、`DAZI_HOST` 覆盖。

不想装命令也可以：`node server/server.js --port 5173`。
Docker：`docker compose up -d`（学生数据挂载在 `server/data`）。

---

## 功能

### 课程（8 章 63 课）
1. **键盘探秘**：基准键 → 上排 → 下排 → 26 字母 → 大写 → 数字 → 符号
2. **单词乐园**：三字母词、动物、颜色、学习用品、数字星期、家庭食物、动作、天气
3. **句子冲浪**：问候句、日常对话、英文绕口令、小故事
4. **汉字输入法**：拼音输入练习（带逐字拼音提示）、古诗、短文
5. **综合实战**：英文长文、中文短文、字母数字混合
6. **古诗与成语**：16 首经典古诗 + 60 余条常用成语（含释义）
7. **分级词汇**：小学英语主题词汇 + 中文量词/家庭/学校/时间词语
8. **实用符号**：时间、日期、邮箱、网址、算式、地址电话

每课有速度 / 准确率目标与 1~3 星评级；课程页是**闯关地图**，节点显示 ★ / 数字 / 🔒。

### 练习体验
- 实时速度（英文 WPM / 中文 字每分）、准确率、连击（连击 10 以上有火焰特效）、进度
- 虚拟键盘高亮下一个键并提示用哪根手指；按错时键位标红 + 光标抖动
- 中文课支持真实拼音输入法，可选逐字拼音提示
- 60 秒速度测试、字母雨键位挑战小游戏

### 智能训练（越练越准）
- **错词本**：打错的单词 / 汉字自动收录，按错误次数排序
- **智能特训**：按你最容易按错的键生成练习（薄弱键占 70%）
- **今日计划**：首页自动生成 3 个任务（新课 / 弱键特训 / 错词复习）

### 竞技
- **实时对战**：4 位房间码，两人同打一篇文章，进度条实时同步（SSE），结束时按完成时间排名
- **成就徽章** 16 枚，从「初次上手」到「全部学完」

### 数据与报表
- 学习报告：速度成长曲线、练习日历（20 周）、键盘热力图、薄弱键位
- **成绩单**：`#/report` 一键打印 / 存 PDF，或生成**家长只读链接**（`#/r/<token>`，无需登录）
- 教师后台：班级码 + 口令登录，学生明细、全班薄弱键位、近 14 天活跃度、CSV 导出、重置学生密码

### 账号
昵称 + 班级码注册（密码可选，忘记可由老师重置）；进度云端同步，断网自动降级离线单机。

教师口令默认 `dazi2026`，可改：`DAZI_TEACHER_CODE=你的口令 dazi`。

---

## 目录结构

```
typing-hero/
├── index.html              # 前端外壳
├── dazi                    # 命令行启动器
├── install.sh              # 安装 dazi 到 PATH
├── Dockerfile / docker-compose.yml
├── assets/
│   ├── css/
│   │   ├── main.css        # 变量、基础组件、动效
│   │   ├── views.css       # 各页面样式（练习页 / 闯关地图 / 对战 / 报表）
│   │   └── print.css       # 打印成绩单
│   └── js/
│       ├── packs.js        # 内容包：古诗 / 成语 / 词语 / 分级词汇 / 实用符号
│       ├── data.js         # 课程定义与练习文本生成（服务端也读它）
│       ├── store.js        # localStorage 存档 + 云端同步 + 错词本
│       ├── api.js          # 后端接口客户端（离线自动降级）
│       ├── engine.js       # 打字引擎：计时、判分、中英文输入
│       ├── keyboard.js     # 虚拟键盘与指法
│       ├── charts.js       # 热力图 / 日历 / 曲线 / 礼花
│       ├── audio.js        # 音效
│       ├── views.js        # 各页面
│       └── app.js          # 路由与登录
└── server/
    ├── server.js           # HTTP 服务：静态托管（gzip）+ 接口路由
    ├── lib/api.js          # 账号 / 进度 / 排行榜 / 教师后台 / 成绩单
    ├── lib/pk.js           # 实时对战房间（SSE）
    └── lib/db.js           # JSON 存储（原子写入 + 每日备份，保留 7 份）
```

页面路由：`#/` 首页 · `#/courses` 课程 · `#/practice/:id` 练习 · `#/drill` 智能特训 · `#/wrong` 错词本 · `#/pk` 实时对战 · `#/test` 测速 · `#/game` 挑战 · `#/rank` 排行榜 · `#/report` 成绩单 · `#/r/:token` 家长查看 · `#/teacher` 教师后台 · `#/stats` 学习报告

## 后端接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/courses` | 下发课程内容（含 packs） |
| GET | `/api/auth/check` | 账号是否存在 / 是否设密码 |
| POST | `/api/auth/register` / `/api/auth/login` | 注册 / 登录 |
| GET | `/api/me` | 当前账号与进度 |
| POST | `/api/me/progress` / `/api/me/session` | 进度同步 / 练习流水 |
| POST | `/api/me/share` | 生成家长只读链接 |
| GET | `/api/report/:token` | 只读成绩单 |
| GET | `/api/leaderboard` | 排行榜（scope=class/all，by=stars/speed/time/acc） |
| POST | `/api/pk/create` / `join` / `start` / `progress` / `leave` | 实时对战 |
| GET | `/api/pk/stream`（SSE） | 对战状态推送 |
| POST | `/api/teacher/login` | 教师登录 |
| GET | `/api/teacher/class` / `export` | 班级总览 / CSV |
| POST | `/api/teacher/reset-password` | 重置学生密码 |

数据文件：`server/data/db.json`（不入库），每天自动备份到 `server/data/backups/`。

## 版本

v1.2.0
