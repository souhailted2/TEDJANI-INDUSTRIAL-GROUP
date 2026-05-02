#!/bin/bash

# =============================================
# سكريبت النشر التلقائي - TEDJANI INDUSTRIAL GROUP
# الاستخدام: ./deploy.sh "رسالة الكوميت"
# =============================================

set -e

# --- التحقق من المتغيرات المطلوبة ---
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ خطأ: GITHUB_TOKEN غير موجود في متغيرات البيئة"
  exit 1
fi
if [ -z "$SERVER_PASSWORD" ]; then
  echo "❌ خطأ: SERVER_PASSWORD غير موجود في متغيرات البيئة"
  exit 1
fi

SERVER_HOST="${SERVER_HOST:-5.75.144.100}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DIR="/root/TEDJANI-INDUSTRIAL-GROUP"
REPO="souhailted2/TEDJANI-INDUSTRIAL-GROUP"
COMMIT_MSG="${1:-تحديث تلقائي}"

echo ""
echo "🚀 بدء عملية النشر..."
echo "📝 رسالة الكوميت: $COMMIT_MSG"
echo ""

# --- الخطوة 1: commit و push إلى GitHub ---
echo "📤 [1/3] رفع التعديلات إلى GitHub..."

git config user.email "deploy@tedjani.com" 2>/dev/null || true
git config user.name "Replit Deploy" 2>/dev/null || true

# ضبط remote URL مع التوكن
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${REPO}.git"

git add -A
git diff --cached --quiet && echo "⚠️  لا توجد تعديلات جديدة للرفع" || {
  git commit -m "$COMMIT_MSG"
  echo "✅ تم إنشاء الكوميت بنجاح"
}

git push origin main
echo "✅ تم الرفع إلى GitHub بنجاح"
echo ""

# --- الخطوة 2: النشر على السيرفر ---
echo "🖥️  [2/3] الاتصال بالسيرفر ونشر التحديثات..."

sshpass -p "$SERVER_PASSWORD" ssh \
  -o StrictHostKeyChecking=no \
  -o ConnectTimeout=30 \
  "${SERVER_USER}@${SERVER_HOST}" \
  "
    set -e
    echo '📥 سحب آخر التعديلات من GitHub...'
    cd ${SERVER_DIR}
    git pull origin main
    echo '🔨 إعادة بناء وتشغيل الحاويات...'
    docker-compose up --build -d
    echo '✅ تم النشر على السيرفر بنجاح'
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep tig
  "

echo ""
echo "✅ [3/3] اكتملت عملية النشر بنجاح!"
echo "🌐 التطبيق متاح على: http://${SERVER_HOST}:3002"
echo ""
