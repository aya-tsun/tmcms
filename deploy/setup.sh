#!/bin/bash
# TMCMS セットアップスクリプト
# さくらのVPS (Ubuntu 22.04) + Docker + Nginx + Let's Encrypt
set -euo pipefail

if [ "$(id -u)" != "0" ]; then
  echo "ERROR: root で実行してください (sudo bash setup.sh)"
  exit 1
fi

echo ""
echo "======================================"
echo "  TMCMS セットアップ開始"
echo "======================================"
echo ""

# ドメイン名を入力
read -p "取得したドメイン名を入力してください (例: tmcms.example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
  echo "ERROR: ドメイン名を入力してください"
  exit 1
fi

read -p "Let's Encrypt 用のメールアドレスを入力してください: " EMAIL
if [ -z "$EMAIL" ]; then
  echo "ERROR: メールアドレスを入力してください"
  exit 1
fi

echo ""

# ----------------------------------------
# 1. システム更新
# ----------------------------------------
echo "[1/7] システムを更新中..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq git curl openssl

# ----------------------------------------
# 2. Docker インストール
# ----------------------------------------
echo "[2/7] Docker をインストール中..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "  → Docker インストール完了"
else
  echo "  → スキップ (インストール済み)"
fi

# ----------------------------------------
# 3. Nginx + Certbot インストール
# ----------------------------------------
echo "[3/7] Nginx / Certbot をインストール中..."
apt-get install -y -qq nginx certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx
echo "  → インストール完了"

# ----------------------------------------
# 4. リポジトリをクローン & 起動
# ----------------------------------------
echo ""
echo "[4/7] アプリをセットアップ中..."
DEPLOY_DIR="/opt/tmcms"

if [ ! -d "$DEPLOY_DIR" ]; then
  git clone -b claude/training-material-cms-4h4fw https://github.com/aya-tsun/tmcms.git "$DEPLOY_DIR"
  echo "  → クローン完了"
else
  cd "$DEPLOY_DIR"
  git pull origin claude/training-material-cms-4h4fw
  echo "  → 最新版に更新"
fi

cd "$DEPLOY_DIR"

if [ ! -f .env ]; then
  SECRET_KEY=$(openssl rand -hex 32)
  echo "SECRET_KEY=$SECRET_KEY" > .env
  echo "  → .env ファイルを作成しました"
fi

docker compose up -d --build
echo "  → Docker コンテナ起動完了"

# ----------------------------------------
# 5. Nginx 初期設定 (HTTP)
# ----------------------------------------
echo ""
echo "[5/7] Nginx を設定中..."

cat > /etc/nginx/sites-available/tmcms << EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tmcms /etc/nginx/sites-enabled/tmcms
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "  → Nginx 設定完了"

# ----------------------------------------
# 6. Let's Encrypt 証明書取得 & HTTPS化
# ----------------------------------------
echo ""
echo "[6/7] HTTPS 証明書を取得中..."
echo "  ※ ドメインのDNSがこのサーバーのIPを向いている必要があります"
echo ""

certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect
echo "  → HTTPS 設定完了 (証明書は90日ごとに自動更新)"

# ----------------------------------------
# 7. 完了
# ----------------------------------------
echo ""
echo "======================================"
echo "  セットアップ完了！"
echo ""
echo "  アクセスURL: https://$DOMAIN"
echo "  ログイン:    admin@example.com"
echo "             admin1234"
echo "======================================"
echo ""
