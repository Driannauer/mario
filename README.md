# Super Mario Bros. HTML5 Game

一个纯前端 HTML5 Canvas 平台跳跃游戏，可直接通过浏览器运行，也适合部署到 GitHub Pages。

## 本地运行

直接打开 `index.html` 即可游玩。也可以在项目目录启动一个静态服务器：

```powershell
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080/
```

## 文件说明

- `index.html`: 页面入口
- `style.css`: 页面样式
- `game.js`: 游戏主逻辑
- `level.js`: 关卡数据
- `sprites.js`: 精灵绘制
- `sound.js`: 音效逻辑
- `攻略.md`: 通关攻略

## 发布

这个项目不需要构建步骤。推送到 GitHub 后，在仓库的 Pages 设置中选择从 `main` 分支根目录发布即可。
