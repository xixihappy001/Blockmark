# Blockmark 链上书签

用于收藏和整理加密货币、交易、行情、链上数据与研究网站的个人导航站。

## 功能

- 按分类浏览和搜索网站，支持新增、删除网站和分类。
- 添加网站时自动显示站点 favicon，也可上传自定义图标。
- 使用卡片右上角的拖动手柄调整排序。
- 手机与桌面自适应布局，手机分类栏支持横向滑动。
- 网站、分类、删除记录和排序保存到云端；上传图标保存到对象存储。

## 本地启动

需要 Node.js 22.13 或更高版本，以及 pnpm。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开终端显示的本地网址。构建命令：

```sh
pnpm build
```

## 项目结构

- `app/page.tsx`：导航页面、收藏管理、拖动排序与同步逻辑。
- `app/globals.css`：全局样式与主题。
- `app/api/sync/route.ts`：收藏数据同步接口。
- `app/api/logos/`：图标上传与读取接口。
- `db/`、`drizzle/`：数据库定义与迁移。
- `public/`：站点图标和图片资源。
- `.openai/hosting.json`、`vite.config.ts`：Sites 发布和运行时绑定配置。

## 1Panel / Docker 部署

仓库包含 `Dockerfile` 和 `docker-compose.yml`。在 1Panel 的容器编排中使用该 Compose 文件即可从 GitHub 构建。服务只监听服务器本机的 `3010` 端口，再由 1Panel 网站反向代理到 `http://127.0.0.1:3010`。

`blockmark-data` 数据卷保存收藏数据库和上传的图标。更新或重启容器不会删除该数据卷。

首次启动后，访问首页会自动建立同步数据表。若需要更新代码，在 1Panel 中重新构建并启动该编排。

## 其他部署说明

当前项目使用 React、Vinext 和 Cloudflare Workers 兼容运行时，依赖 D1（`DB`）及 R2（`LOGOS`）绑定。Docker 部署通过本地 Workers 运行时提供并持久化这两个绑定；现有 Sites 配置仍关联原网站。

当前同步数据是站点级个人收藏，访问保护由原 Sites 托管入口提供。部署到其他环境时，需要同时配置身份验证和访问控制；本项目尚未实现独立的 Google 或邮箱登录，也不是可直接放入普通静态服务器的纯静态站点。

仓库只包含源码、资源和配置，不包含账号凭据、线上收藏数据库、上传图标数据或依赖缓存。上传到 GitHub 本身不会启动网站服务。
