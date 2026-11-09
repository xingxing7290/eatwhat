# 华为云服务器到期备份

2026 年 11 月 9 日从 hcss-ecs-a8c9 导出。

包含当前项目工作树及完整 Git bundle、whateat 的 MongoDB 逻辑导出、全部 907 个上传文件、生效的 /etc/eatwhat 配置，以及 /var/backups/eatwhat 中的小型历史导出。

归档保存部署时的源码、未提交文件、数据及恢复配置。node_modules、.next、Python 虚拟环境、编译缓存由项目依赖清单重新生成。Git 历史以归档内的 history/*.bundle 保存。

数据库和配置含个人资料及认证信息，使用独立的 256 位密钥通过 AES-256-GCM 加密。密钥单独保存在操作者本机的 decryption-keys.json 文件中，请另存到自己的密码管理器或离线介质。

## 解密和核对

需要 Node.js 18 或更新版本，在这个目录运行。

```sh
node restore-backup.cjs --keys /安全位置/decryption-keys.json --output /恢复目录
```

脚本自动校验文件哈希，合并分片，验证 GCM 认证标签，解密并核对归档哈希。生成 eatwhat-20261109.tar.gz 后，在隔离目录解包。

```sh
mkdir restored
tar -xzf /恢复目录/eatwhat-20261109.tar.gz -C restored
```

files/ 下按服务器原路径保存工作树及配置。在线 SQLite 已替换为在线备份 API 生成的一致性快照。snapshot-manifest.json 记录原目录、Git 提交、工作树状态与 SQLite 表计数。history/ 下的 bundle 可用 git clone 恢复提交历史，再将对应工作树覆盖到克隆目录恢复未提交内容。数据库导出位于 databases/。

PostgreSQL 导出可用 pg_restore 恢复到单独的新数据库。MongoDB 导出可用 mongorestore --archive=whateat.archive.gz --gzip 恢复到隔离实例。恢复后核对记录与附件，再配置环境并启动服务。

verification.json 保存加密前后归档哈希、归档文件数和源 Git 提交。源提交为 15f17ffd8de5e032a7bb96ea14a3207be86bfba8。
