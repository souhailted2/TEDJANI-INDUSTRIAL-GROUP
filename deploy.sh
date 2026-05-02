#!/bin/bash

# =============================================
# سكريبت النشر - TEDJANI INDUSTRIAL GROUP
# الاستخدام: ./deploy.sh
# ملاحظة: يفترض أن التغييرات مُودَعة (commit) مسبقاً
# المتغيرات المطلوبة كـ Replit Secrets:
#   GITHUB_TOKEN    - توكن GitHub للرفع
#   SERVER_PASSWORD - كلمة مرور SSH للسيرفر
# =============================================

set -e

# --- التحقق من توفر sshpass ---
if ! command -v sshpass &>/dev/null; then
  echo "❌ خطأ: sshpass غير مثبت."
  echo "   تثبيته: nix-env -iA nixpkgs.sshpass"
  exit 1
fi

# --- إعدادات السيرفر ---
SERVER_HOST="${SERVER_HOST:-5.75.144.100}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DIR="/root/TEDJANI-INDUSTRIAL-GROUP"

# --- التحقق من الـ secrets المطلوبة ---
MISSING=()
[ -z "$GITHUB_TOKEN" ]    && MISSING+=("GITHUB_TOKEN")
[ -z "$SERVER_PASSWORD" ] && MISSING+=("SERVER_PASSWORD")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ خطأ: الـ secrets التالية مطلوبة ولم تُضبط:"
  for v in "${MISSING[@]}"; do echo "   - $v"; done
  echo "أضفها في: Replit → الإعدادات → Secrets"
  exit 1
fi

echo ""
echo "🚀 بدء عملية النشر..."
echo "🖥️  السيرفر: ${SERVER_USER}@${SERVER_HOST}"
echo ""

# --- الخطوة 1: push إلى GitHub ---
echo "📤 [1/2] رفع الكود إلى GitHub..."
CRED_FILE=$(mktemp)
trap "rm -f '$CRED_FILE'" EXIT
chmod 600 "$CRED_FILE"
printf 'https://x-token:%s@github.com\n' "$GITHUB_TOKEN" > "$CRED_FILE"
git -c credential.helper="store --file=$CRED_FILE" push origin main
echo "✅ تم الرفع إلى GitHub بنجاح"
echo ""

# --- الخطوة 2: النشر على السيرفر ---
echo "🖥️  [2/2] الاتصال بالسيرفر ونشر التحديثات..."

sshpass -p "$SERVER_PASSWORD" ssh \
  -o StrictHostKeyChecking=no \
  -o ConnectTimeout=30 \
  "${SERVER_USER}@${SERVER_HOST}" \
  "
    set -e
    echo '📥 سحب آخر التعديلات من GitHub...'
    cd ${SERVER_DIR}
    git pull origin main
    echo '🔨 بناء الصورة الجديدة...'
    docker compose build
    echo '🔄 إعادة تشغيل الحاويات...'
    docker compose up -d --force-recreate
    echo '✅ تم النشر على السيرفر بنجاح'
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep tig || true
  "

echo ""
echo "✅ اكتملت عملية النشر بنجاح!"
echo "🌐 التطبيق متاح على: http://${SERVER_HOST}:3002"
echo ""
