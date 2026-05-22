from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# ===================== LOAD ENVIRONMENT =====================
ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

# ===================== READ CONFIG =====================
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "spjrsd")

if not mongo_url:
    raise ValueError("MONGO_URL is not set in environment variables")

# ===================== INIT CLIENT =====================
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
