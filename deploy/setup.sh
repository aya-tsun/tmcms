#!/bin/bash
# TMCMS セットアップスクリプト
# さくらのVPS (Ubuntu 22.04) + Docker + Tailscale + Nginx
set -euo pipefail

# root で実行する
if [ "$(id -u)" != "0" ]; then
  echo "ERROR: root で実行してください (sudo bash setup.sh)"
  exit 1
fi

echo ""
echo "======================================"
echo "  TMCMS セットアップ開始"
echo "======================================"
echo ""

# ----------------------------------------
# 1. システム更新
# ----------------------------------------
echo "[1/8] システムを更新中..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq git curl jq openssl

# ----------------------------------------
# 2. Docker インストール
# ----------------------------------------
echo "[2/8] Docker をインストール中..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "  → Docker インストール完了"
else
  echo "  → スキップ (インストール済み)"
fi

# ----------------------------------------
# 3. Nginx インストール
# ----------------------------------------
echo "[3/8] Nginx をインストール中..."
if ! command -v nginx &> /dev/null; then
  apt-get install -y -qq nginx
  echo "  → Nginx インストール完了"
else
  echo "  → スキップ (インストール済み)"
fi

# ----------------------------------------
# 4. Tailscale インストール
# ----------------------------------------
echo "[4/8] Tailscale をインストール中..."
if ! command -v tailscale &> /dev/null; then
  curl -fsSL https://tailscale.com/install.sh | sh
  echo "  → Tailscale インストール完了"
else
  echo "  → スキップ (インストール済み)"
fi

# ----------------------------------------
# 5. Tailscale 認証
# ----------------------------------------
echo ""
echo "[5/8] Tailscale にログインします..."
echo "  ブラウザで表示されるURLを開いて認証してください。"
echo ""
tailscale up --accept-routes --ssh

TAILSCALE_HOST=$(tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//')
echo ""
echo "  → Tailscale ホスト名: $TAILSCALE_HOST"

# ----------------------------------------
# 6. リポジトリをクローン & 起動
# ----------------------------------------
echo ""
echo "[6/8] アプリをセットアップ中..."
DEPLOY_DIR="/opt/tmcms"

if [ ! -d "$DEPLOY_DIR" ]; then
  git clone https://github.com/aya-tsun/tmcms.git "$DEPLOY_DIR"
  echo "  → クローン完了"
else
  cd "$DEPLOY_DIR"
  git pull origin claude/training-material-cms-4h4fw
  echo "  → 最新版に更新"
fi

cd "$DEPLOY_DIR"

# .env ファイル作成
if [ ! -f .env ]; then
  SECRET_KEY=$(openssl rand -hex 32)
  echo "SECRET_KEY=$SECRET_KEY" > .env
  echo "  → .env ファイルを作成しました"
fi

# Docker Compose で起動
docker compose up -d --build
echo "  → Docker コンテナ起動完了"

# ----------------------------------------
# 7. Tailscale HTTPS 証明書取得
# ----------------------------------------
echo ""
echo "[7/8] HTTPS 証明書を取得中..."
tailscale cert "$TAILSCALE_HOST"

CERT_DIR="/var/lib/tailscale/certs"

# Nginx が証明書を読めるように権限設定
chmod 644 "$CERT_DIR/$TAILSCALE_HOST.crt"
chmod 640 "$CERT_DIR/$TAILSCALE_HOST.key"
chown root:www-data "$CERT_DIR/$TAILSCALE_HOST.key"

echo "  → 証明書取得完了"

# ----------------------------------------
# 8. Nginx 設定
# ----------------------------------------
echo ""
echo "[8/8] Nginx を設定中..."

cat > /etc/nginx/sites-available/tmcms << EOF
server {
    listen 443 ssl;
    server_name $TAILSCALE_HOST;

    ssl_certificate $CERT_DIR/$TAILSCALE_HOST.crt;
    ssl_certificate_key $CERT_DIR/$TAILSCALE_HOST.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

server {
    listen 80;
    server_name $TAILSCALE_HOST;
    return 301 https://\$host\$request_uri;
}
EOF

ln -sf /etc/nginx/sites-available/tmcms /etc/nginx/sites-enabled/tmcms
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

# ----------------------------------------
# 証明書の自動更新 (月1回)
# ----------------------------------------
cat > /etc/cron.monthly/tailscale-cert-renew << 'CRONEOF'
#!/bin/bash
HOST=$(tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//')
tailscale cert "$HOST"
chmod 640 "/var/lib/tailscale/certs/$HOST.key"
chown root:www-data "/var/lib/tailscale/certs/$HOST.key"
systemctl reload nginx
CRONEOF
chmod +x /etc/cron.monthly/tailscale-cert-renew

echo ""
echo "======================================"
echo "  セットアップ完了！"
echo ""
echo "  アクセスURL: https://$TAILSCALE_HOST"
echo "  ログイン:    admin@example.com"
echo "             admin1234"
echo ""
echo "  ※ Tailscaleアプリを端末にも入れてください"
echo "    https://tailscale.com/download"
echo "======================================"
echo ""
