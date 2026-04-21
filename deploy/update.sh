#!/bin/bash
# TMCMS アップデートスクリプト
# コードを最新版に更新して再起動する
set -euo pipefail

if [ "$(id -u)" != "0" ]; then
  echo "ERROR: root で実行してください (sudo bash update.sh)"
  exit 1
fi

cd /opt/tmcms

echo "最新版を取得中..."
git pull origin main

echo "コンテナを再ビルド・再起動中..."
docker compose up -d --build

echo ""
echo "アップデート完了！"
