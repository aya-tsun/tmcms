import os

SECRET_KEY = os.environ.get("SECRET_KEY", "tmcms-secret-key-change-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours
