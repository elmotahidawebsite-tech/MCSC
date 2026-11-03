# 🚀 CSC — دليل النشر الرسمي (قابل للتكرار لكل عميل)

> القاعدة الذهبية: كل عميل = سيرفر منفصل + دومين منفصل + قاعدة بيانات منفصلة.
> ممنوع مشاركة سيرفر واحد بين عميلين (بيانات قضايا = حساسية قصوى).

---

## 0) ملفات لازم تكون موجودة في الريبو (تتعمل مرة واحدة)

```
deploy/
├── docker-compose.yml
├── .env.template
├── nginx/
│   ├── http-only.conf      ← مرحلة استخراج الشهادة
│   └── full.conf           ← الإعداد النهائي HTTPS
└── backup.sh
csc_backend/Dockerfile
DEPLOYMENT_GUIDE.md  (الملف ده)
```

### 0.1 تعديل دائم في `config/settings.py` (مرة واحدة)

```python
import os

# الداتابيز: PostgreSQL لو متغيرات البيئة موجودة، غير كده SQLite للتطوير
if os.environ.get("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["POSTGRES_DB"],
            "USER": os.environ["POSTGRES_USER"],
            "PASSWORD": os.environ["POSTGRES_PASSWORD"],
            "HOST": os.environ.get("POSTGRES_HOST", "db"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

# إعدادات الإنتاج الإجبارية
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
```

### 0.2 أضف لـ `requirements.txt` (مرة واحدة)

```
gunicorn
psycopg2-binary
```

### 0.3 `csc_backend/Dockerfile`

```dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--max-requests", "500", "--max-requests-jitter", "50"]
```

### 0.4 `deploy/docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  web:
    build: ../csc_backend
    restart: unless-stopped
    env_file: .env
    volumes:
      - media_data:/app/media
      - logs_data:/app/logs
      - static_data:/app/staticfiles
    depends_on:
      db:
        condition: service_healthy

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ../csc_frontend/dist:/var/www/frontend:ro
      - media_data:/var/www/media:ro
      - static_data:/var/www/static:ro
      - /var/www/certbot:/var/www/certbot
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [web]

volumes:
  pgdata:
  media_data:
  logs_data:
  static_data:
```

### 0.5 `deploy/nginx/http-only.conf` (مرحلة الشهادة)

```nginx
server {
    listen 80;
    server_name __DOMAIN__;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { proxy_pass http://web:8000; proxy_set_header Host $host; }
}
```

### 0.6 `deploy/nginx/full.conf` (النهائي)

```nginx
server {
    listen 80;
    server_name __DOMAIN__;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    http2 on;
    server_name __DOMAIN__;

    ssl_certificate     /etc/letsencrypt/live/__DOMAIN__/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/__DOMAIN__/privkey.pem;

    client_max_body_size 200M;

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    root /var/www/frontend;
    index index.html;

    location /api/    { proxy_pass http://web:8000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-Proto $scheme; proxy_read_timeout 300s; }
    location /admin/  { proxy_pass http://web:8000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-Proto $scheme; }
    location /media/  { alias /var/www/media/;  expires 30d; }
    location /static/ { alias /var/www/static/; expires 30d; }
    location / { try_files $uri $uri/ /index.html; }
}
```

### 0.7 `deploy/.env.template`

```env
DEBUG=False
SECRET_KEY=CHANGE_ME
ALLOWED_HOSTS=__DOMAIN__
POSTGRES_DB=csc
POSTGRES_USER=csc_user
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_HOST=db
```

### 0.8 `deploy/backup.sh`

```bash
#!/bin/bash
# نسخة احتياطية يومية: قاعدة البيانات + الوسائط
set -e
DIR=/backups/$(date +%F)
mkdir -p "$DIR"
cd "$(dirname "$0")"
docker compose exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$DIR/db.sql.gz"
docker run --rm -v "$(docker compose volume ls -q | grep media_data | head -1)":/media:ro -v "$DIR":/out alpine tar czf /out/media.tar.gz -C /media .
find /backups -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;
echo "[$(date)] backup OK -> $DIR"
```

---

## 1) تجهيز نسخة جديدة (على جهازك — لكل إصدار)

- [ ] اللفة التأكيديه (برومت كوبيلوت) → كلها ✅
- [ ] اختبارات يدوية: login / رفع صورة / رفض exe / Download Case / health
- [ ] بناء الفرونت: `npm ci && npm run build` (الـ API relative: `/api`)
- [ ] Tag للإصدار: `git tag v1.X.0 && git push --tags`
- [ ] سجّل الإصدار في سجل العملاء (قسم 5)

## 2) نشر لعميل جديد (Runbook — بالترتيب)

### على السيرفر (Ubuntu 24.04، 4GB RAM على الأقل):

```bash
# 1) الأساسيات + الجدار الناري
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 certbot rsync
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable

# 2) مجلدات العمل
sudo mkdir -p /opt/csc /var/www/certbot /backups
sudo chown -R $USER /opt/csc /backups
```

### على جهازك:

```bash
# 3) ارفع الكود (من جذر المشروع)
rsync -avz --delete \
  --exclude venv --exclude __pycache__ --exclude node_modules \
  --exclude db.sqlite3 --exclude logs --exclude media --exclude .git \
  ./csc_backend ./csc_frontend/dist ./deploy user@SERVER_IP:/opt/csc/
```

### على السيرفر:

```bash
cd /opt/csc/deploy
mkdir -p nginx/conf.d

# 4) ملف البيئة بأسرار جديدة لكل عميل
cp .env.template .env
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # → SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # → POSTGRES_PASSWORD
nano .env   # حط القيم + DOMAIN في ALLOWED_HOSTS

# 5) إعداد nginx مرحلة أولى + استبدال الدومين
sed "s/__DOMAIN__/DOMAIN_BETAAK/g" nginx/http-only.conf > nginx/conf.d/app.conf

# 6) تشغيل أولي واستخراج الشهادة
docker compose build
docker compose up -d
sudo certbot certonly --webroot -w /var/www/certbot -d DOMAIN_BETAAK --email EMAIL_BETAAK --agree-tos -n

# 7) التفعيل النهائي HTTPS
sed "s/__DOMAIN__/DOMAIN_BETAAK/g" nginx/full.conf > nginx/conf.d/app.conf
docker compose exec nginx nginx -s reload

# 8) تهيئة التطبيق
docker compose run --rm web python manage.py collectstatic --noinput
docker compose run --rm web python manage.py migrate
docker compose run --rm web python manage.py createsuperuser

# 9) تجديد الشهادات تلقائيًا + الباك أب اليومي
(crontab -l 2>/dev/null; echo "0 4 * * * certbot renew --webroot -w /var/www/certbot && cd /opt/csc/deploy && docker compose exec -T nginx nginx -s reload") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/csc/deploy/backup.sh >> /var/log/csc-backup.log 2>&1") | crontab -
```

### اختبار الدخان بعد النشر (إجباري):

- [ ] `https://DOMAIN` يفتح الفرونت (وقفل أحمر سليم)
- [ ] `http://DOMAIN` بيحوّل لـ https تلقائيًا
- [ ] `https://DOMAIN/api/health/` → `"status": "healthy"`
- [ ] Login ناجح + رفع صورة + صورة تظهر
- [ ] رفع `.exe` متسمي `.jpg` → مرفوض
- [ ] Download Case → ZIP سليم
- [ ] `/admin/` يفتح (غيّر باسورد الأدمن الافتراضي فورًا!)

## 3) تحديث عميل موجود بإصدار جديد

```bash
# على جهازك: بناء فرونت جديد + tag جديد، ثم:
rsync -avz --delete --exclude .env --exclude nginx/conf.d \
  ./csc_backend ./csc_frontend/dist ./deploy user@SERVER_IP:/opt/csc/

# على السيرفر:
cd /opt/csc/deploy
./backup.sh                      # ← باك أب قبل أي تحديث، دائمًا
docker compose build web
docker compose run --rm web python manage.py migrate --noinput
docker compose run --rm web python manage.py collectstatic --noinput
docker compose up -d
# ثم اختبار الدخان قسم 2
```

## 4) نقل عميل لسيرفر جديد (مع بياناته)

```bash
# القديم:
cd /opt/csc/deploy && ./backup.sh
scp /backups/AAAA-AA-AA/* user@NEW_SERVER:/backups/restore/

# الجديد (بعد خطوات قسم 2 لحد خطوة 8 بدون createsuperuser):
gunzip -c /backups/restore/db.sql.gz | docker compose exec -T db psql -U csc_user csc
docker run --rm -v /backups/restore/media.tar.gz:/m.tgz:ro -v <media_volume>:/media alpine tar xzf /m.tgz -C /media
```

## 5) سجل العملاء (حدّثه مع كل نشر)

| العميل | الدومين | IP | إصدار | تاريخ النشر | مكان الأسرار | ملاحظات |
|---|---|---|---|---|---|---|
| مثال | cases.x.gov | 1.2.3.4 | v1.2.0 | 2026-11-10 | Password Manager / عميل X | — |

> الأسرار (`.env` + باسورد الأدمن) تُحفظ في Password Manager عندك، مش في الريبو أبدًا.