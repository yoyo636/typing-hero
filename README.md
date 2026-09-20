# 打字小英雄 ⌨️

面向小学生的打字练习网站：5 章 34 课循序渐进的指法课程、实时纠错与指法提示、班级排行榜、教师后台，以及一键启动的 `dazi` 命令。

- **纯前端**：无框架、无构建，双击 `index.html` 也能离线单机使用
- **零依赖后端**：只用 Node 标准库（http / crypto / vm），数据存 JSON 文件
- **一键启动**：终端输入 `dazi` 即启动服务并打开浏览器

---

## 快速开始

```bash
# 安装 dazi 命令（只需一次，装到 ~/.local/bin 并写入 PATH）
bash install.sh

# 启动（自动开浏览器，Ctrl+C 只退出日志，服务继续后台运行）
dazi
```

其他命令：

| 命令 | 作用 |
| --- | --- |
| `dazi stop` | 停止服务 |
| `dazi restart` | 重启服务 |
| `dazi status` | 查看运行状态 |
| `dazi open` | 只打开网页 |
| `dazi log` | 查看运行日志 |
| `dazi info` | 显示网址 / 数据文件 / 教师口令 |

默认端口 `5173`，被占用会自动顺延；端口记录在 `server/data/port.txt`。
浏览器打开 http://localhost:5173 即可。

不想安装命令也可以直接跑：

```bash
node server/server.js --port 5173
```

## 功能

**课程（5 章 34 课）**
1. 键盘探秘：基准键 → 上排 → 下排 → 26 字母 → 大写 → 数字 → 符号
2. 单词乐园：三字母词、动物、颜色、学习用品、数字星期、家庭食物、动作、天气
3. 句子冲浪：问候句、日常对话、英文绕口令、小故事
4. 汉字输入法：拼音输入练习（带逐字拼音提示）、古诗、短文
5. 综合实战：英文长文、中文短文、字母数字混合

每课有速度 / 准确率目标，1~3 星评级，顺序闯关解锁（本章完成一半可开启下一章）。

**练习体验**
- 实时速度（英文 WPM / 中文 字每分）、准确率、连击、进度
- 虚拟键盘高亮下一个键并提示用哪根手指，按错时标红并提示正确键
- WebAudio 音效（无需音频文件），可在「学习报告 → 设置」中关闭
- 60 秒速度测试、字母雨键位挑战小游戏

**账号与云同步**
- 注册 / 登录：昵称 + 班级码，密码可选（小学生忘记密码可由老师在后台重置）
- 进度云端同步，换电脑不丢；断网自动降级为离线单机模式

**排行榜 & 教师后台**
- 排行榜：班级榜 / 全校榜，按星星 / 速度 / 时长 / 准确率排名
- 教师后台：班级码 + 教师口令登录，查看学生明细、全班薄弱键位、近 14 天活跃度，导出 CSV，重置学生密码

教师口令默认 `dazi2026`，可用环境变量修改：

```bash
DAZI_TEACHER_CODE=你的口令 dazi
```

## 目录结构

```
typing-hero/
├── index.html              # 前端外壳
├── dazi                    # 命令行启动器
├── install.sh              # 安装 dazi 到 PATH
├── assets/
│   ├── css/main.css
│   └── js/
│       ├── data.js         # 课程与词库（服务端也读它，课程内容单一数据源）
│       ├── store.js        # localStorage 存档 + 云端同步
│       ├── api.js          # 后端接口客户端（离线自动降级）
│       ├── engine.js       # 打字引擎：计时、判分、中英文输入
│       ├── keyboard.js     # 虚拟键盘与指法
│       ├── audio.js        # 音效
│       ├── views.js        # 各页面
│       └── app.js          # 路由与登录
└── server/
    ├── server.js           # HTTP 服务：静态托管 + 接口路由
    ├── lib/api.js          # 账号 / 进度 / 排行榜 / 教师后台
    └── lib/db.js           # JSON 存储（原子写入 + 每日备份，保留 7 份）
```

前端页面路由：`#/` 首页 · `#/courses` 课程 · `#/practice/:id` 练习 · `#/test` 测速 · `#/game` 挑战 · `#/rank` 排行榜 · `#/teacher` 教师后台 · `#/stats` 学习报告

## 后端接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/courses` | 下发课程内容 |
| GET | `/api/auth/check` | 查询账号是否存在、是否设了密码 |
| POST | `/api/auth/register` | 注册（昵称 + 班级码 + 可选密码） |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/me` | 当前账号与进度 |
| POST | `/api/me/progress` | 进度同步（各项取最大） |
| POST | `/api/me/session` | 上传练习流水 |
| GET | `/api/leaderboard` | 排行榜（scope=class/all，by=stars/speed/time/acc） |
| POST | `/api/teacher/login` | 教师登录（班级码 + 口令） |
| GET | `/api/teacher/class` | 班级总览 |
| GET | `/api/teacher/export` | 导出班级 CSV |
| POST | `/api/teacher/reset-password` | 重置学生密码 |

数据文件：`server/data/db.json`（不入库，见 `.gitignore`），每天自动备份到 `server/data/backups/`。

## 版本

v1.1.0
