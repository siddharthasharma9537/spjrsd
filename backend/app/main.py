from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import io
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import hashlib
import jwt
import pandas as pd
from pymongo import UpdateOne
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from app.routes import volunteer
from app.database.db import db
from app.routes import newsletter
from app.routes import contact

IST = ZoneInfo("Asia/Kolkata")

# ===== FILE INDEX =====
# 1. Setup & DB
# 2. Security
# 3. Models
# 4. Auth
# 5. Sevas
# 6. Slots
# 7. Bookings
# 8. Donations
# 9. Accommodation
# 10. News & Gallery
# 11. Admin
# 12. Volunteer / Newsletter / Contact
# 13. Visitor Stats
# 14. Live Streams
# 15. Panchangam
# 16. Live Blog
# 17. Seed & Root
# ======================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError('JWT_SECRET is not set in environment variables')

app = FastAPI()
origins = [
    "https://cheruvugattu.online",
    "https://www.cheruvugattu.online",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def verify_password(pw: str, hashed: str) -> bool:
    return hash_password(pw) == hashed

def create_token(payload: dict, hours: int = 24) -> str:
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=hours)
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

async def get_current_devotee(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "devotee":
            raise HTTPException(status_code=403, detail="Not a devotee")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") not in ["EO", "Clerk", "Cashier", "Priest"]:
            raise HTTPException(status_code=403, detail="Not an admin")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_devotee(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return payload
    except Exception:
        return None

# --- Pydantic Models ---
class DevoteeRegister(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = ""
    gotram: Optional[str] = ""
    password: str

class DevoteeLogin(BaseModel):
    mobile: str
    password: str

class DevoteeForgotPassword(BaseModel):
    mobile: str
    email: str
    new_password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class SevaCreate(BaseModel):
    name_english: str
    name_telugu: str
    description: Optional[str] = ""
    base_price: float
    duration_minutes: int = 30
    is_online_bookable: bool = True
    is_paroksha_available: bool = False
    max_per_slot_default: int = 20
    max_persons_per_ticket: int = 4
    special_instructions: Optional[str] = ""
    active_flag: bool = True

class SevaUpdate(BaseModel):
    name_english: Optional[str] = None
    name_telugu: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_online_bookable: Optional[bool] = None
    is_paroksha_available: Optional[bool] = None
    max_per_slot_default: Optional[int] = None
    max_persons_per_ticket: Optional[int] = None
    special_instructions: Optional[str] = None
    active_flag: Optional[bool] = None

class DayProfileCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    is_special_day_flag: bool = False

class DayProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_special_day_flag: Optional[bool] = None

class SlotCreate(BaseModel):
    seva_id: str
    profile_id: str
    date: Optional[str] = None
    start_time: str
    end_time: str
    max_bookings: int = 20
    online_quota: int = 10
    counter_quota: int = 10

class SlotUpdate(BaseModel):
    seva_id: Optional[str] = None
    profile_id: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    max_bookings: Optional[int] = None
    online_quota: Optional[int] = None
    counter_quota: Optional[int] = None

class BookingCreate(BaseModel):
    seva_id: str
    slot_id: str
    for_date: str
    number_of_persons: int = 1
    gotram: str
    is_paroksha: bool = False
    nakshatra: Optional[str] = ""
    rashi: Optional[str] = ""

class BookingStatusUpdate(BaseModel):
    status: str

class DonationCreate(BaseModel):
    donation_type: str  # e-Hundi, AnnaPrasadam
    amount: float
    donor_name: str
    donor_mobile: str
    donor_email: Optional[str] = ""
    donor_gotram: Optional[str] = ""
    message: Optional[str] = ""
    is_anonymous: bool = False

class AccommodationCreate(BaseModel):
    name: str
    name_telugu: Optional[str] = ""
    description: Optional[str] = ""
    room_type: str  # AC, Non-AC, Cottage, Guest House, Dormitory
    capacity: int = 2
    price_per_day: float
    amenities: Optional[str] = ""
    total_rooms: int = 10
    active_flag: bool = True

class AccommodationUpdate(BaseModel):
    name: Optional[str] = None
    name_telugu: Optional[str] = None
    description: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = None
    price_per_day: Optional[float] = None
    amenities: Optional[str] = None
    total_rooms: Optional[int] = None
    active_flag: Optional[bool] = None

class AccommodationBookingCreate(BaseModel):
    accommodation_id: str
    check_in_date: str
    check_out_date: str
    num_rooms: int = 1
    num_guests: int = 1
    special_requests: Optional[str] = ""

class NewsCreate(BaseModel):
    title: str
    title_telugu: Optional[str] = ""
    content: str
    content_telugu: Optional[str] = ""
    is_important: bool = False
    active_flag: bool = True

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    title_telugu: Optional[str] = None
    content: Optional[str] = None
    content_telugu: Optional[str] = None
    is_important: Optional[bool] = None
    active_flag: Optional[bool] = None

class GalleryCreate(BaseModel):
    title: str
    image_url: str
    category: Optional[str] = "Temple"
    active_flag: bool = True

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    active_flag: Optional[bool] = None

class DonationReceiptRequest(BaseModel):
    donation_id: str

class VolunteerRegister(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = ""
    city: Optional[str] = ""
    skills: Optional[str] = ""
    availability: Optional[str] = ""
    message: Optional[str] = ""

class NewsletterSubscribe(BaseModel):
    email: str

class ContactMessage(BaseModel):
    name: str
    email: str
    mobile: Optional[str] = ""
    subject: str
    message: str

class PanchangamCreate(BaseModel):
    date: str  # YYYY-MM-DD
    vaaram: Optional[str] = ""
    vaaram_telugu: Optional[str] = ""
    masa: Optional[str] = ""
    masa_telugu: Optional[str] = ""
    paksha: Optional[str] = ""
    paksha_telugu: Optional[str] = ""
    tithi: str
    tithi_telugu: Optional[str] = ""
    tithi_timing: Optional[str] = ""
    nakshatra: str
    nakshatra_telugu: Optional[str] = ""
    nakshatra_timing: Optional[str] = ""
    yoga: Optional[str] = ""
    yoga_telugu: Optional[str] = ""
    karana: Optional[str] = ""
    karana_telugu: Optional[str] = ""
    sunrise: Optional[str] = ""
    sunset: Optional[str] = ""
    rahu_kalam: Optional[str] = ""
    yamagandam: Optional[str] = ""
    gulika_kalam: Optional[str] = ""
    abhijit_muhurtam: Optional[str] = ""
    varjyam: Optional[str] = ""
    durmuhurtham: Optional[str] = ""
    special_note: Optional[str] = ""
    special_note_telugu: Optional[str] = ""

class PanchangamUpdate(BaseModel):
    vaaram: Optional[str] = None
    vaaram_telugu: Optional[str] = None
    masa: Optional[str] = None
    masa_telugu: Optional[str] = None
    paksha: Optional[str] = None
    paksha_telugu: Optional[str] = None
    tithi: Optional[str] = None
    tithi_telugu: Optional[str] = None
    tithi_timing: Optional[str] = None
    nakshatra: Optional[str] = None
    nakshatra_telugu: Optional[str] = None
    nakshatra_timing: Optional[str] = None
    yoga: Optional[str] = None
    yoga_telugu: Optional[str] = None
    karana: Optional[str] = None
    karana_telugu: Optional[str] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    rahu_kalam: Optional[str] = None
    yamagandam: Optional[str] = None
    gulika_kalam: Optional[str] = None
    abhijit_muhurtam: Optional[str] = None
    varjyam: Optional[str] = None
    durmuhurtham: Optional[str] = None
    special_note: Optional[str] = None
    special_note_telugu: Optional[str] = None

class LiveBlogPostCreate(BaseModel):
    event_name: str
    event_name_telugu: Optional[str] = ""
    title: str
    title_telugu: Optional[str] = ""
    content: str
    content_telugu: Optional[str] = ""
    image_url: Optional[str] = ""
    is_pinned: bool = False
    active_flag: bool = True

class LiveBlogPostUpdate(BaseModel):
    event_name: Optional[str] = None
    event_name_telugu: Optional[str] = None
    title: Optional[str] = None
    title_telugu: Optional[str] = None
    content: Optional[str] = None
    content_telugu: Optional[str] = None
    image_url: Optional[str] = None
    is_pinned: Optional[bool] = None
    active_flag: Optional[bool] = None

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/devotee/register")
async def devotee_register(data: DevoteeRegister):
    existing = await db.devotees.find_one({"mobile": data.mobile}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")
    devotee = {
        "id": str(uuid.uuid4()), "name": data.name, "mobile": data.mobile,
        "email": data.email, "gotram": data.gotram,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": datetime.now(timezone.utc).isoformat()
    }
    await db.devotees.insert_one(devotee)
    token = create_token({"sub": devotee["id"], "name": devotee["name"], "mobile": devotee["mobile"], "role": "devotee"})
    return {"token": token, "devotee": {k: v for k, v in devotee.items() if k not in ["_id", "password_hash"]}}

@api_router.post("/auth/devotee/login")
async def devotee_login(data: DevoteeLogin):
    devotee = await db.devotees.find_one({"mobile": data.mobile}, {"_id": 0})
    if not devotee or not verify_password(data.password, devotee.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    await db.devotees.update_one({"id": devotee["id"]}, {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}})
    token = create_token({"sub": devotee["id"], "name": devotee["name"], "mobile": devotee["mobile"], "role": "devotee"})
    return {"token": token, "devotee": {k: v for k, v in devotee.items() if k not in ["_id", "password_hash"]}}

@api_router.post("/auth/devotee/forgot-password")
async def devotee_forgot_password(data: DevoteeForgotPassword):
    devotee = await db.devotees.find_one({"mobile": data.mobile})
    registered_email = (devotee or {}).get("email", "").strip().lower()
    if not devotee or not registered_email or registered_email != data.email.strip().lower():
        raise HTTPException(status_code=400, detail="No devotee account matches that mobile number and email")
    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    await db.devotees.update_one({"id": devotee["id"]}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"message": "Password reset successful"}

@api_router.post("/auth/admin/login")
async def admin_login(data: AdminLogin):
    user = await db.user_accounts.find_one({"username": data.username}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("active_flag", False):
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_token({"sub": user["id"], "name": user["name"], "role": user["role"], "username": user["username"]})
    return {"token": token, "user": {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}}

@api_router.get("/devotee/profile")
async def get_devotee_profile(user=Depends(get_current_devotee)):
    devotee = await db.devotees.find_one({"id": user["sub"]}, {"_id": 0, "password_hash": 0})
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")
    return devotee

# ==================== SEVA ROUTES ====================
@api_router.get("/sevas")
async def list_sevas(active_only: bool = True, paroksha: Optional[bool] = None):
    query = {}
    if active_only:
        query["active_flag"] = True
    if paroksha is not None:
        query["is_paroksha_available"] = paroksha
    sevas = await db.sevas.find(query, {"_id": 0}).to_list(100)
    return sevas

@api_router.get("/sevas/{seva_id}")
async def get_seva(seva_id: str):
    seva = await db.sevas.find_one({"id": seva_id}, {"_id": 0})
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
    return seva

@api_router.post("/admin/sevas")
async def create_seva(data: SevaCreate, user=Depends(get_current_admin)):
    seva = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.sevas.insert_one(seva)
    return {k: v for k, v in seva.items() if k != "_id"}

@api_router.put("/admin/sevas/{seva_id}")
async def update_seva(seva_id: str, data: SevaUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.sevas.update_one({"id": seva_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Seva not found")
    return await db.sevas.find_one({"id": seva_id}, {"_id": 0})

@api_router.delete("/admin/sevas/{seva_id}")
async def delete_seva(seva_id: str, user=Depends(get_current_admin)):
    result = await db.sevas.delete_one({"id": seva_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Seva not found")
    return {"message": "Seva deleted"}

# ==================== DAY PROFILE ROUTES ====================
@api_router.get("/day-profiles")
async def list_day_profiles():
    return await db.day_profiles.find({}, {"_id": 0}).to_list(100)

@api_router.post("/admin/day-profiles")
async def create_day_profile(data: DayProfileCreate, user=Depends(get_current_admin)):
    profile = {"id": str(uuid.uuid4()), **data.model_dump()}
    await db.day_profiles.insert_one(profile)
    return {k: v for k, v in profile.items() if k != "_id"}

@api_router.put("/admin/day-profiles/{profile_id}")
async def update_day_profile(profile_id: str, data: DayProfileUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.day_profiles.update_one({"id": profile_id}, {"$set": update_data})
    return await db.day_profiles.find_one({"id": profile_id}, {"_id": 0})

@api_router.delete("/admin/day-profiles/{profile_id}")
async def delete_day_profile(profile_id: str, user=Depends(get_current_admin)):
    result = await db.day_profiles.delete_one({"id": profile_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile deleted"}

# ==================== SCHEDULE SLOT ROUTES ====================
@api_router.get("/schedule-slots")
async def list_schedule_slots(seva_id: Optional[str] = None, profile_id: Optional[str] = None):
    query = {}
    if seva_id: query["seva_id"] = seva_id
    if profile_id: query["profile_id"] = profile_id
    return await db.schedule_slots.find(query, {"_id": 0}).to_list(500)

@api_router.get("/slots/available")
async def get_available_slots(seva_id: str, date: str):
    slots = await db.schedule_slots.find({"seva_id": seva_id}, {"_id": 0}).to_list(100)
    available = []
    for slot in slots:
        if slot.get("date") and slot["date"] != date:
            continue
        booked = await db.bookings.count_documents({"slot_id": slot["id"], "for_date": date, "status": {"$nin": ["Cancelled"]}})
        remaining = slot.get("online_quota", 10) - booked
        if remaining > 0:
            slot["remaining_slots"] = remaining
            slot["booked_count"] = booked
            available.append(slot)
    return available

@api_router.post("/admin/schedule-slots")
async def create_schedule_slot(data: SlotCreate, user=Depends(get_current_admin)):
    slot = {"id": str(uuid.uuid4()), **data.model_dump()}
    await db.schedule_slots.insert_one(slot)
    return {k: v for k, v in slot.items() if k != "_id"}

@api_router.put("/admin/schedule-slots/{slot_id}")
async def update_schedule_slot(slot_id: str, data: SlotUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.schedule_slots.update_one({"id": slot_id}, {"$set": update_data})
    return await db.schedule_slots.find_one({"id": slot_id}, {"_id": 0})

@api_router.delete("/admin/schedule-slots/{slot_id}")
async def delete_schedule_slot(slot_id: str, user=Depends(get_current_admin)):
    result = await db.schedule_slots.delete_one({"id": slot_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"message": "Slot deleted"}

# ==================== BOOKING ROUTES ====================
@api_router.post("/bookings")
async def create_booking(data: BookingCreate, user=Depends(get_current_devotee)):
    seva = await db.sevas.find_one({"id": data.seva_id}, {"_id": 0})
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
    slot = await db.schedule_slots.find_one({"id": data.slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if data.number_of_persons < 1 or data.number_of_persons > seva.get("max_persons_per_ticket", 4):
        raise HTTPException(status_code=400, detail=f"Number of persons must be 1-{seva.get('max_persons_per_ticket', 4)}")
    booked = await db.bookings.count_documents({"slot_id": data.slot_id, "for_date": data.for_date, "status": {"$nin": ["Cancelled"]}})
    if booked >= slot.get("online_quota", 10):
        raise HTTPException(status_code=400, detail="No slots available")
    devotee = await db.devotees.find_one({"id": user["sub"]}, {"_id": 0, "password_hash": 0})
    booking = {
        "id": str(uuid.uuid4()),
        "booking_number": f"SPJR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}",
        "devotee_id": user["sub"], "devotee_name": devotee.get("name", ""),
        "devotee_mobile": devotee.get("mobile", ""),
        "seva_id": data.seva_id, "seva_name_english": seva.get("name_english", ""),
        "seva_name_telugu": seva.get("name_telugu", ""),
        "slot_id": data.slot_id, "slot_start_time": slot.get("start_time", ""),
        "slot_end_time": slot.get("end_time", ""),
        "booking_date_time": datetime.now(timezone.utc).isoformat(),
        "for_date": data.for_date, "status": "Confirmed", "payment_status": "Paid",
        "number_of_persons": data.number_of_persons, "gotram": data.gotram,
        "is_paroksha": data.is_paroksha,
        "nakshatra": data.nakshatra or "", "rashi": data.rashi or "",
        "amount": seva.get("base_price", 0),
        "note_to_devotee": seva.get("special_instructions", "")
    }
    await db.bookings.insert_one(booking)
    return {k: v for k, v in booking.items() if k != "_id"}

@api_router.get("/bookings/my")
async def get_my_bookings(user=Depends(get_current_devotee)):
    return await db.bookings.find({"devotee_id": user["sub"]}, {"_id": 0}).sort("booking_date_time", -1).to_list(100)

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@api_router.get("/bookings/lookup/ticket")
async def lookup_ticket(booking_number: Optional[str] = None, mobile: Optional[str] = None):
    if booking_number:
        booking = await db.bookings.find_one({"booking_number": booking_number}, {"_id": 0})
        if booking:
            return [booking]
    if mobile:
        bookings = await db.bookings.find({"devotee_mobile": mobile}, {"_id": 0}).sort("booking_date_time", -1).to_list(20)
        return bookings
    raise HTTPException(status_code=400, detail="Provide booking_number or mobile")

@api_router.get("/admin/bookings")
async def admin_list_bookings(date: Optional[str] = None, seva_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_admin)):
    query = {}
    if date: query["for_date"] = date
    if seva_id: query["seva_id"] = seva_id
    if status: query["status"] = status
    return await db.bookings.find(query, {"_id": 0}).sort("booking_date_time", -1).to_list(500)

@api_router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, data: BookingStatusUpdate, user=Depends(get_current_admin)):
    valid_statuses = ["Pending", "Confirmed", "Completed", "Cancelled", "NoShow"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": data.status}})
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})

# ==================== DONATION ROUTES (e-Hundi + AnnaPrasadam) ====================
@api_router.post("/donations")
async def create_donation(data: DonationCreate, user=Depends(get_optional_devotee)):
    donation = {
        "id": str(uuid.uuid4()),
        "donation_number": f"DON-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}",
        "donation_type": data.donation_type,
        "amount": data.amount,
        "donor_name": data.donor_name if not data.is_anonymous else "Anonymous",
        "donor_mobile": data.donor_mobile,
        "donor_email": data.donor_email,
        "donor_gotram": data.donor_gotram,
        "message": data.message,
        "is_anonymous": data.is_anonymous,
        "devotee_id": user["sub"] if user else None,
        "payment_status": "Paid",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.donations.insert_one(donation)
    return {k: v for k, v in donation.items() if k != "_id"}

@api_router.get("/donations/my")
async def get_my_donations(user=Depends(get_current_devotee)):
    return await db.donations.find({"devotee_id": user["sub"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/admin/donations")
async def admin_list_donations(donation_type: Optional[str] = None, user=Depends(get_current_admin)):
    query = {}
    if donation_type: query["donation_type"] = donation_type
    return await db.donations.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.get("/admin/donation-stats")
async def admin_donation_stats(user=Depends(get_current_admin)):
    pipeline_hundi = [{"$match": {"donation_type": "e-Hundi", "payment_status": "Paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}]
    pipeline_anna = [{"$match": {"donation_type": "AnnaPrasadam", "payment_status": "Paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}]
    hundi = await db.donations.aggregate(pipeline_hundi).to_list(1)
    anna = await db.donations.aggregate(pipeline_anna).to_list(1)
    return {
        "e_hundi": {"total": hundi[0]["total"] if hundi else 0, "count": hundi[0]["count"] if hundi else 0},
        "anna_prasadam": {"total": anna[0]["total"] if anna else 0, "count": anna[0]["count"] if anna else 0}
    }

@api_router.get("/donations/{donation_id}/receipt")
async def get_donation_receipt(donation_id: str):
    donation = await db.donations.find_one({"id": donation_id}, {"_id": 0})
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation.get("payment_status") != "Paid":
        raise HTTPException(status_code=400, detail="Receipt only for paid donations")
    receipt = {
        "receipt_number": f"80G-{donation.get('donation_number', '')[4:]}",
        "donation_number": donation.get("donation_number", ""),
        "donation_type": donation.get("donation_type", ""),
        "donor_name": donation.get("donor_name", ""),
        "donor_mobile": donation.get("donor_mobile", ""),
        "donor_email": donation.get("donor_email", ""),
        "donor_gotram": donation.get("donor_gotram", ""),
        "amount": donation.get("amount", 0),
        "amount_words": _amount_to_words(int(donation.get("amount", 0))),
        "payment_status": donation.get("payment_status", ""),
        "date": donation.get("created_at", ""),
        "temple_name": "Sri Parvati Jadala Ramalingeshwara Swamy Devastanam",
        "temple_name_telugu": "శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం",
        "temple_address": "Cheruvugattu, Nalgonda, Telangana",
        "pan_number": "AAAXX0000X",
        "registration_number": "TE/END/REG/XXXX",
        "section": "Section 80G of Income Tax Act, 1961",
        "financial_year": f"{datetime.now(timezone.utc).year}-{datetime.now(timezone.utc).year+1}",
        "is_anonymous": donation.get("is_anonymous", False)
    }
    return receipt

def _amount_to_words(n: int) -> str:
    if n == 0: return "Zero"
    ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"]
    tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"]
    def _convert(num):
        if num < 20: return ones[num]
        if num < 100: return tens[num//10] + (" " + ones[num%10] if num%10 else "")
        if num < 1000: return ones[num//100] + " Hundred" + (" and " + _convert(num%100) if num%100 else "")
        if num < 100000: return _convert(num//1000) + " Thousand" + (" " + _convert(num%1000) if num%1000 else "")
        if num < 10000000: return _convert(num//100000) + " Lakh" + (" " + _convert(num%100000) if num%100000 else "")
        return _convert(num//10000000) + " Crore" + (" " + _convert(num%10000000) if num%10000000 else "")
    return _convert(n) + " Rupees Only"

# ==================== ACCOMMODATION ROUTES ====================
@api_router.get("/accommodations")
async def list_accommodations(active_only: bool = True):
    query = {"active_flag": True} if active_only else {}
    return await db.accommodations.find(query, {"_id": 0}).to_list(50)

@api_router.get("/accommodations/{acc_id}")
async def get_accommodation(acc_id: str):
    acc = await db.accommodations.find_one({"id": acc_id}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=404, detail="Accommodation not found")
    return acc

@api_router.post("/admin/accommodations")
async def create_accommodation(data: AccommodationCreate, user=Depends(get_current_admin)):
    acc = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.accommodations.insert_one(acc)
    return {k: v for k, v in acc.items() if k != "_id"}

@api_router.put("/admin/accommodations/{acc_id}")
async def update_accommodation(acc_id: str, data: AccommodationUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.accommodations.update_one({"id": acc_id}, {"$set": update_data})
    return await db.accommodations.find_one({"id": acc_id}, {"_id": 0})

@api_router.delete("/admin/accommodations/{acc_id}")
async def delete_accommodation(acc_id: str, user=Depends(get_current_admin)):
    result = await db.accommodations.delete_one({"id": acc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Accommodation not found")
    return {"message": "Accommodation deleted"}

# ==================== ACCOMMODATION BOOKING ROUTES ====================
@api_router.post("/accommodation-bookings")
async def create_accommodation_booking(data: AccommodationBookingCreate, user=Depends(get_current_devotee)):
    acc = await db.accommodations.find_one({"id": data.accommodation_id}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=404, detail="Accommodation not found")
    devotee = await db.devotees.find_one({"id": user["sub"]}, {"_id": 0, "password_hash": 0})
    from datetime import date as dt_date
    check_in = datetime.strptime(data.check_in_date, "%Y-%m-%d").date()
    check_out = datetime.strptime(data.check_out_date, "%Y-%m-%d").date()
    num_days = (check_out - check_in).days
    if num_days < 1:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    total_amount = acc["price_per_day"] * data.num_rooms * num_days
    booking = {
        "id": str(uuid.uuid4()),
        "booking_number": f"ACC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}",
        "devotee_id": user["sub"], "devotee_name": devotee.get("name", ""),
        "devotee_mobile": devotee.get("mobile", ""),
        "accommodation_id": data.accommodation_id,
        "accommodation_name": acc.get("name", ""),
        "room_type": acc.get("room_type", ""),
        "check_in_date": data.check_in_date, "check_out_date": data.check_out_date,
        "num_days": num_days, "num_rooms": data.num_rooms, "num_guests": data.num_guests,
        "special_requests": data.special_requests,
        "amount": total_amount, "payment_status": "Paid", "status": "Confirmed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.accommodation_bookings.insert_one(booking)
    return {k: v for k, v in booking.items() if k != "_id"}

@api_router.get("/accommodation-bookings/my")
async def get_my_accommodation_bookings(user=Depends(get_current_devotee)):
    return await db.accommodation_bookings.find({"devotee_id": user["sub"]}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/admin/accommodation-bookings")
async def admin_list_accommodation_bookings(user=Depends(get_current_admin)):
    return await db.accommodation_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.put("/admin/accommodation-bookings/{booking_id}/status")
async def update_acc_booking_status(booking_id: str, data: BookingStatusUpdate, user=Depends(get_current_admin)):
    await db.accommodation_bookings.update_one({"id": booking_id}, {"$set": {"status": data.status}})
    return await db.accommodation_bookings.find_one({"id": booking_id}, {"_id": 0})

# ==================== NEWS ROUTES ====================
@api_router.get("/news")
async def list_news(active_only: bool = True):
    query = {"active_flag": True} if active_only else {}
    return await db.news.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/news/{news_id}")
async def get_news(news_id: str):
    item = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="News not found")
    return item

@api_router.post("/admin/news")
async def create_news(data: NewsCreate, user=Depends(get_current_admin)):
    item = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.news.insert_one(item)
    return {k: v for k, v in item.items() if k != "_id"}

@api_router.put("/admin/news/{news_id}")
async def update_news(news_id: str, data: NewsUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.news.update_one({"id": news_id}, {"$set": update_data})
    return await db.news.find_one({"id": news_id}, {"_id": 0})

@api_router.delete("/admin/news/{news_id}")
async def delete_news(news_id: str, user=Depends(get_current_admin)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

# ==================== PANCHANGAM ROUTES ====================
@api_router.get("/panchangam/today")
async def get_todays_panchangam():
    # Panchangam dates are calendar days in India, not UTC - using UTC's date
    # here would show yesterday's entry for the ~5.5 hours after midnight IST
    # each night, until UTC's own date rolls over.
    today = datetime.now(IST).strftime("%Y-%m-%d")
    item = await db.panchangam.find_one({"date": today}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Panchangam not available for today")
    return item

_PURNIMA_NAMES = {"purnima", "pournami", "paurnami", "poornima", "purnami"}
_AMAVASYA_NAMES = {"amavasya", "amavasye", "amavasi", "amavaasya"}

@api_router.get("/panchangam/next-purnima-amavasya")
async def get_next_purnima_amavasya(days: int = 45):
    today = datetime.now(IST).date()
    end = today + timedelta(days=days)
    docs = await db.panchangam.find(
        {"date": {"$gte": today.isoformat(), "$lte": end.isoformat()}},
        {"_id": 0, "date": 1, "tithi": 1, "tithi_telugu": 1, "tithi_timing": 1},
    ).sort("date", 1).to_list(days + 1)

    async def _find(names):
        for doc in docs:
            if (doc.get("tithi") or "").strip().lower() in names:
                prev_date = (datetime.strptime(doc["date"], "%Y-%m-%d").date() - timedelta(days=1)).isoformat()
                prev = await db.panchangam.find_one(
                    {"date": prev_date, "tithi": {"$exists": True}},
                    {"_id": 0, "date": 1, "tithi": 1, "tithi_telugu": 1, "tithi_timing": 1},
                )
                return {
                    "date": doc["date"],
                    "tithi": doc.get("tithi"),
                    "tithi_telugu": doc.get("tithi_telugu"),
                    "end_time": doc.get("tithi_timing") or "",
                    "start_date": prev["date"] if prev else None,
                    "start_time": (prev.get("tithi_timing") or "") if prev else "",
                    "start_tithi": prev.get("tithi") if prev else None,
                    "start_tithi_telugu": prev.get("tithi_telugu") if prev else None,
                }
        return None

    purnima = await _find(_PURNIMA_NAMES)
    amavasya = await _find(_AMAVASYA_NAMES)
    return {"purnima": purnima, "amavasya": amavasya}

@api_router.get("/panchangam")
async def get_panchangam_by_date(date: str):
    item = await db.panchangam.find_one({"date": date}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Panchangam not available for this date")
    return item

@api_router.get("/admin/panchangam")
async def admin_list_panchangam(user=Depends(get_current_admin)):
    return await db.panchangam.find({}, {"_id": 0}).sort("date", -1).to_list(1000)

@api_router.post("/admin/panchangam")
async def create_panchangam(data: PanchangamCreate, user=Depends(get_current_admin)):
    existing = await db.panchangam.find_one({"date": data.date})
    if existing:
        raise HTTPException(status_code=400, detail="Panchangam already exists for this date")
    item = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.panchangam.insert_one(item)
    return {k: v for k, v in item.items() if k != "_id"}

@api_router.put("/admin/panchangam/{item_id}")
async def update_panchangam(item_id: str, data: PanchangamUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.panchangam.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Panchangam entry not found")
    return await db.panchangam.find_one({"id": item_id}, {"_id": 0})

@api_router.delete("/admin/panchangam/{item_id}")
async def delete_panchangam(item_id: str, user=Depends(get_current_admin)):
    result = await db.panchangam.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Panchangam entry not found")
    return {"message": "Panchangam entry deleted"}

_WEEKDAY_TELUGU = {
    "Sunday": "ఆదివారం", "Monday": "సోమవారం", "Tuesday": "మంగళవారం", "Wednesday": "బుధవారం",
    "Thursday": "గురువారం", "Friday": "శుక్రవారం", "Saturday": "శనివారం"
}
_PAKSHA_TELUGU = {"Shukla": "శుక్ల పక్షం", "Bahula": "బహుళ పక్షం", "Krishna": "బహుళ పక్షం"}

def _clean_cell(v) -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    return str(v).strip()

@api_router.post("/admin/panchangam/bulk-import")
async def bulk_import_panchangam(file: UploadFile = File(...), user=Depends(get_current_admin)):
    filename = (file.filename or "").lower()
    if not filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Upload an Excel (.xlsx/.xls) or CSV file")
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents)) if filename.endswith(".csv") else pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    if "gregorian_date" not in df.columns or "tithi_tithi_name_english" not in df.columns or "nakshatra_nakshatra_name_english" not in df.columns:
        raise HTTPException(status_code=400, detail="File is missing required columns (gregorian_date, tithi_tithi_name_english, nakshatra_nakshatra_name_english)")

    errors = []
    operations = []
    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed + header row
        try:
            date_val = _clean_cell(row.get("gregorian_date"))
            if not date_val:
                errors.append(f"Row {row_num}: missing date")
                continue
            date_val = str(pd.to_datetime(date_val).date())
            weekday = _clean_cell(row.get("weekday"))
            paksha = _clean_cell(row.get("pakshamu"))
            notes = [_clean_cell(row.get("festivals_or_notes")), _clean_cell(row.get("symbols_detected"))]
            doc = {
                "date": date_val,
                "vaaram": weekday, "vaaram_telugu": _WEEKDAY_TELUGU.get(weekday, ""),
                "masa": _clean_cell(row.get("telugu_masamu")), "masa_telugu": "",
                "paksha": paksha, "paksha_telugu": _PAKSHA_TELUGU.get(paksha, ""),
                "tithi": _clean_cell(row.get("tithi_tithi_name_english")),
                "tithi_telugu": _clean_cell(row.get("tithi_tithi_name_telugu")),
                "tithi_timing": _clean_cell(row.get("tithi_source_text")),
                "nakshatra": _clean_cell(row.get("nakshatra_nakshatra_name_english")),
                "nakshatra_telugu": _clean_cell(row.get("nakshatra_nakshatra_name_telugu")),
                "nakshatra_timing": _clean_cell(row.get("nakshatra_source_text")),
                "varjyam": _clean_cell(row.get("varjyam_source_text")),
                "durmuhurtham": _clean_cell(row.get("durmuhurtham_source_text")),
                "sunrise": _clean_cell(row.get("suryodayam")),
                "sunset": _clean_cell(row.get("suryasthamayam")),
                "special_note": "; ".join(n for n in notes if n),
            }
            if not doc["tithi"] or not doc["nakshatra"]:
                errors.append(f"Row {row_num} ({date_val}): missing tithi or nakshatra")
                continue
            operations.append(UpdateOne(
                {"date": date_val},
                {
                    "$set": doc,
                    "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}
                },
                upsert=True
            ))
        except Exception as e:
            errors.append(f"Row {row_num}: {e}")

    imported, updated = 0, 0
    if operations:
        result = await db.panchangam.bulk_write(operations, ordered=False)
        imported = result.upserted_count
        updated = result.modified_count
    return {"total_rows": len(df), "imported": imported, "updated": updated, "errors": errors}

# ==================== LIVE BLOG ROUTES ====================
@api_router.get("/live-blog")
async def list_live_blog(active_only: bool = True, event_name: Optional[str] = None, limit: int = 50):
    query = {}
    if active_only:
        query["active_flag"] = True
    if event_name:
        query["event_name"] = event_name
    return await db.live_blog.find(query, {"_id": 0}).sort([("is_pinned", -1), ("posted_at", -1)]).to_list(limit)

@api_router.get("/live-blog/events")
async def list_live_blog_events():
    events = await db.live_blog.distinct("event_name", {"active_flag": True})
    return events

@api_router.get("/live-blog/{post_id}")
async def get_live_blog_post(post_id: str):
    item = await db.live_blog.find_one({"id": post_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Live blog post not found")
    return item

@api_router.get("/admin/live-blog")
async def admin_list_live_blog(user=Depends(get_current_admin)):
    return await db.live_blog.find({}, {"_id": 0}).sort([("is_pinned", -1), ("posted_at", -1)]).to_list(200)

@api_router.post("/admin/live-blog")
async def create_live_blog_post(data: LiveBlogPostCreate, user=Depends(get_current_admin)):
    item = {
        "id": str(uuid.uuid4()), **data.model_dump(),
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "posted_by": user.get("name", "")
    }
    await db.live_blog.insert_one(item)
    return {k: v for k, v in item.items() if k != "_id"}

@api_router.put("/admin/live-blog/{post_id}")
async def update_live_blog_post(post_id: str, data: LiveBlogPostUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.live_blog.update_one({"id": post_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Live blog post not found")
    return await db.live_blog.find_one({"id": post_id}, {"_id": 0})

@api_router.delete("/admin/live-blog/{post_id}")
async def delete_live_blog_post(post_id: str, user=Depends(get_current_admin)):
    result = await db.live_blog.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Live blog post not found")
    return {"message": "Live blog post deleted"}

# ==================== GALLERY ROUTES ====================
@api_router.get("/gallery")
async def list_gallery(active_only: bool = True, media_type: Optional[str] = None):
    query = {}
    if active_only:
        query["active_flag"] = True
    if media_type:
        query["media_type"] = media_type
    return await db.gallery.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.post("/admin/gallery")
async def create_gallery(data: GalleryCreate, user=Depends(get_current_admin)):
    item = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.gallery.insert_one(item)
    return {k: v for k, v in item.items() if k != "_id"}

@api_router.put("/admin/gallery/{item_id}")
async def update_gallery(item_id: str, data: GalleryUpdate, user=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.gallery.update_one({"id": item_id}, {"$set": update_data})
    return await db.gallery.find_one({"id": item_id}, {"_id": 0})

@api_router.delete("/admin/gallery/{item_id}")
async def delete_gallery(item_id: str, user=Depends(get_current_admin)):
    result = await db.gallery.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}

# ==================== ADMIN DEVOTEES + STATS ====================
@api_router.get("/admin/devotees")
async def admin_list_devotees(user=Depends(get_current_admin)):
    return await db.devotees.find({}, {"_id": 0, "password_hash": 0}).to_list(500)

@api_router.get("/admin/stats")
async def admin_stats(user=Depends(get_current_admin)):
    total_devotees = await db.devotees.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    today = datetime.now(IST).strftime("%Y-%m-%d")
    today_bookings = await db.bookings.count_documents({"for_date": today})
    total_sevas = await db.sevas.count_documents({"active_flag": True})
    confirmed_bookings = await db.bookings.count_documents({"status": "Confirmed"})
    pipeline = [{"$match": {"payment_status": "Paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    rev = await db.bookings.aggregate(pipeline).to_list(1)
    total_revenue = rev[0]["total"] if rev else 0
    total_donations = await db.donations.count_documents({})
    don_pipeline = [{"$match": {"payment_status": "Paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    don_rev = await db.donations.aggregate(don_pipeline).to_list(1)
    total_donation_amount = don_rev[0]["total"] if don_rev else 0
    total_acc_bookings = await db.accommodation_bookings.count_documents({})
    return {
        "total_devotees": total_devotees, "total_bookings": total_bookings,
        "today_bookings": today_bookings, "total_sevas": total_sevas,
        "confirmed_bookings": confirmed_bookings, "total_revenue": total_revenue,
        "total_donations": total_donations, "total_donation_amount": total_donation_amount,
        "total_acc_bookings": total_acc_bookings
    }


# ==================== NEWSLETTER ROUTES ====================
@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(data: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"message": "Already subscribed"}
    await db.newsletter.insert_one({"id": str(uuid.uuid4()), "email": data.email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Subscribed successfully"}

# ==================== VISITOR STATS ROUTES ====================
@api_router.get("/visitor-stats")
async def get_visitor_stats():
    stats = await db.visitor_stats.find_one({"key": "main"}, {"_id": 0})
    if not stats:
        stats = {"total_visitors": 12847, "todays_visitors": 0, "last_reset_date": datetime.now(IST).strftime("%Y-%m-%d")}
    today = datetime.now(IST).strftime("%Y-%m-%d")
    if stats.get("last_reset_date") != today:
        await db.visitor_stats.update_one({"key": "main"}, {"$set": {"todays_visitors": 0, "last_reset_date": today}}, upsert=True)
        stats["todays_visitors"] = 0
    return stats

@api_router.post("/visitor-stats/track")
async def track_visitor():
    today = datetime.now(IST).strftime("%Y-%m-%d")
    result = await db.visitor_stats.find_one({"key": "main"})
    if not result:
        await db.visitor_stats.insert_one({"key": "main", "total_visitors": 12848, "todays_visitors": 1, "last_reset_date": today})
    else:
        update = {"$inc": {"total_visitors": 1, "todays_visitors": 1}}
        if result.get("last_reset_date") != today:
            update = {"$inc": {"total_visitors": 1}, "$set": {"todays_visitors": 1, "last_reset_date": today}}
        await db.visitor_stats.update_one({"key": "main"}, update)
    return {"message": "tracked"}

# ==================== LIVE STREAM ROUTES ====================
@api_router.get("/live-streams")
async def get_live_streams():
    return await db.live_streams.find({}, {"_id": 0}).to_list(10)


# ==================== SEED DATA ====================
@api_router.post("/seed")
async def seed_data():
    admin_exists = await db.user_accounts.find_one({"username": "admin"})
    if admin_exists:
        return {"message": "Data already seeded"}
    admin = {"id": str(uuid.uuid4()), "name": "Temple EO", "mobile": "9000000001", "role": "EO", "username": "admin", "password_hash": hash_password("admin123"), "active_flag": True}
    await db.user_accounts.insert_one(admin)
    sevas = [
        {"id": str(uuid.uuid4()), "name_english": "Abhishekam", "name_telugu": "అభిషేకం", "description": "Sacred bathing ritual of Sri Ramalingeshwara Swamy", "base_price": 200, "duration_minutes": 45, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "Please arrive 30 minutes before the scheduled time. Wear traditional attire.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Swamy Vari Masa Kalyanam", "name_telugu": "శ్రీ స్వామివారి మాసకళ్యాణం", "description": "Monthly celestial marriage ceremony of the Swamy, performed every Pournami", "base_price": 1116, "duration_minutes": 90, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 5, "max_persons_per_ticket": 4, "special_instructions": "Special occasion puja. Bring traditional items as instructed.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Ashtottaram", "name_telugu": "అష్టోత్తరం", "description": "Chanting of 108 sacred names of the deity", "base_price": 30, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 25, "max_persons_per_ticket": 4, "special_instructions": "Available on all days.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Swamy Vari Nija Abhishekam", "name_telugu": "శ్రీ స్వామివారి నిజాభిషేకం", "description": "Special abhishekam performed directly for the deity", "base_price": 1000, "duration_minutes": 60, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 8, "max_persons_per_ticket": 4, "special_instructions": "Full duration puja. Please be present throughout.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Kobbarikaya Mudupu", "name_telugu": "కొబ్బరికాయ ముడుపు", "description": "Offering of coconut as a vow to the deity", "base_price": 15, "duration_minutes": 10, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 30, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Swamy Vari Kalyanam", "name_telugu": "శ్రీ స్వామివారి కళ్యాణం", "description": "Celestial marriage ceremony of Lord Shiva and Goddess Parvathi", "base_price": 1000, "duration_minutes": 90, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 5, "max_persons_per_ticket": 4, "special_instructions": "Special occasion puja. Bring traditional items as instructed.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Kumkumarchana", "name_telugu": "కుంకుమార్చన", "description": "Special archana performed with sacred kumkum powder", "base_price": 30, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 25, "max_persons_per_ticket": 4, "special_instructions": "Special significance on Fridays.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Ammavari Alayam Pallaki Seva", "name_telugu": "శ్రీ అమ్మవారి ఆలయంలో పల్లకిసేవ", "description": "Palanquin procession seva at the Ammavari temple", "base_price": 350, "duration_minutes": 30, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Hanumanthudiki Abhishekam", "name_telugu": "హనుమంతుడికి అభిషేకం", "description": "Abhishekam for Sri Anjaneya Swamy", "base_price": 50, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Ammavari Alayam Vahana Seva", "name_telugu": "శ్రీ అమ్మవారి ఆలయంలో వాహనసేవ", "description": "Vehicle-borne procession seva at the Ammavari temple", "base_price": 500, "duration_minutes": 30, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Mokkubadi Samarpana", "name_telugu": "మొక్కుబడి సమర్పణ", "description": "Offering to fulfil a vow made to the deity", "base_price": 10, "duration_minutes": 10, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 30, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Yellamma Bonam", "name_telugu": "ఎల్లమ్మ బోనం", "description": "Bonam offering to Sri Yellamma Amma Vari", "base_price": 50, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Mokkubadi Kode Trippikattuta", "name_telugu": "మొక్కుబడి కోడె త్రిప్పికట్టుట", "description": "Offering of a young bull as a vow, traditionally after being blessed with children", "base_price": 500, "duration_minutes": 30, "is_online_bookable": False, "is_paroksha_available": False, "max_per_slot_default": 5, "max_persons_per_ticket": 4, "special_instructions": "Please contact the temple office in advance.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Odi Biyyam", "name_telugu": "ఒడిబియ్యం", "description": "Traditional rice offering ceremony", "base_price": 10, "duration_minutes": 10, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 30, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Vivaham", "name_telugu": "వివాహం", "description": "Wedding ceremony conducted at the temple", "base_price": 300, "duration_minutes": 120, "is_online_bookable": False, "is_paroksha_available": False, "max_per_slot_default": 2, "max_persons_per_ticket": 20, "special_instructions": "Please contact the temple office in advance to book.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Talaneelalu", "name_telugu": "తలనీలాలు", "description": "Tonsure offering as a vow to the deity", "base_price": 50, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 20, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Sri Satyanarayana Swamy Vratam", "name_telugu": "శ్రీ సత్యనారాయణ స్వామి వ్రతం", "description": "Traditional vratam of Sri Satyanarayana Swamy", "base_price": 300, "duration_minutes": 90, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 8, "max_persons_per_ticket": 6, "special_instructions": "Especially performed during Karthika Masam.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Vastu Samarpana", "name_telugu": "వస్తు సమర్పణ", "description": "Offering of items to the deity", "base_price": 5, "duration_minutes": 10, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 30, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Vahana Puja (4-Wheeler)", "name_telugu": "వాహనపూజ (నాలుగు చక్రాలు)", "description": "Puja for newly purchased four-wheelers", "base_price": 200, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Pratyeka Darshanam", "name_telugu": "ప్రత్యేక దర్శనం", "description": "Special expedited darshan of the deity", "base_price": 50, "duration_minutes": 15, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 40, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Bhari Vahana Puja (Lorry, JCB)", "name_telugu": "భారీ వాహనపూజ (లారీ, జెసిబి)", "description": "Puja for heavy vehicles such as lorries and JCBs", "base_price": 300, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Pancharathi", "name_telugu": "పంచహారతి", "description": "Five-lamp aarti offering to the deity", "base_price": 516, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Auto Puja", "name_telugu": "ఆటో పూజ", "description": "Puja for newly purchased auto-rickshaws", "base_price": 100, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Maha Abhishekam (Yellamma Alayam)", "name_telugu": "మహా అభిషేకం (ఎల్లమ్మ ఆలయం)", "description": "Grand abhishekam performed at the Yellamma temple", "base_price": 216, "duration_minutes": 45, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Vahana Puja (2-Wheeler)", "name_telugu": "వాహన పూజ (రెండు చక్రాలు)", "description": "Puja for newly purchased two-wheelers", "base_price": 50, "duration_minutes": 15, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 20, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Aakupuja (Anjaneya Swamy)", "name_telugu": "ఆకుపూజ (ఆంజనేయ స్వామివారికి)", "description": "Leaf-garland offering for Sri Anjaneya Swamy", "base_price": 216, "duration_minutes": 30, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "Especially performed on Sri Hanuman Jayanti.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Laksha Pushparchana", "name_telugu": "లక్ష పుష్పార్చన", "description": "Grand offering of one lakh flowers to the deity", "base_price": 1116, "duration_minutes": 90, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 5, "max_persons_per_ticket": 4, "special_instructions": "Conducted every Amavasya evening at 7 PM.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Mandala Pujalu", "name_telugu": "మండల పూజలు", "description": "41-day Mandala Deeksha pujas performed for devotees", "base_price": 216, "duration_minutes": 45, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Rudra Homam", "name_telugu": "రుద్రహోమం", "description": "Sacred fire ritual with Rudra Namakam Chamakam chanting", "base_price": 1116, "duration_minutes": 75, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 6, "max_persons_per_ticket": 4, "special_instructions": "Performed every month on Chaturdashi, the day before Amavasya.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Puttu Ventrukalu", "name_telugu": "పుట్టు వెంట్రుకలు", "description": "First-hair tonsure ceremony for infants", "base_price": 100, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Chandi Homam", "name_telugu": "చండీ హోమం", "description": "Sacred fire ritual dedicated to Goddess Chandi, performed every Pournami", "base_price": 1116, "duration_minutes": 90, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 6, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Gotra Namarchana", "name_telugu": "గోత్ర నామార్చన", "description": "Archana performed by gotra and nakshatram", "base_price": 30, "duration_minutes": 15, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 25, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Sahasranamarchana", "name_telugu": "సహస్ర నామార్చన", "description": "Chanting of 1000 names of the deity during the puja", "base_price": 516, "duration_minutes": 60, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 8, "max_persons_per_ticket": 4, "special_instructions": "Full duration puja. Please be present throughout.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Veda Ashirvachanam", "name_telugu": "వేద ఆశీర్వచనం", "description": "Vedic blessing ceremony by temple priests", "base_price": 516, "duration_minutes": 30, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Shanti Puja", "name_telugu": "శాంతి పూజ", "description": "Peace puja performed to ward off doshas", "base_price": 516, "duration_minutes": 45, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Bhagavataradhana", "name_telugu": "భగవతారాధన", "description": "Devotional worship service dedicated to the Lord", "base_price": 1116, "duration_minutes": 60, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 8, "max_persons_per_ticket": 4, "special_instructions": "", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.sevas.insert_many(sevas)
    profiles = [
        {"id": str(uuid.uuid4()), "name": "Normal Day", "description": "Regular weekday schedule", "is_special_day_flag": False},
        {"id": str(uuid.uuid4()), "name": "Weekend", "description": "Saturday and Sunday schedule with extended hours", "is_special_day_flag": False},
        {"id": str(uuid.uuid4()), "name": "Pournami", "description": "Full moon day - special puja timings", "is_special_day_flag": True},
        {"id": str(uuid.uuid4()), "name": "Amavasya", "description": "New moon day", "is_special_day_flag": True},
        {"id": str(uuid.uuid4()), "name": "Maha Shivaratri", "description": "Annual grand festival of Lord Shiva", "is_special_day_flag": True},
    ]
    await db.day_profiles.insert_many(profiles)
    normal_id, weekend_id = profiles[0]["id"], profiles[1]["id"]
    slots = []
    for seva in sevas:
        for pid in [normal_id, weekend_id]:
            for st, et in [("06:00","07:00"),("08:00","09:00"),("10:00","11:00"),("16:00","17:00"),("18:00","19:00")]:
                slots.append({"id": str(uuid.uuid4()), "seva_id": seva["id"], "profile_id": pid, "date": None, "start_time": st, "end_time": et, "max_bookings": seva["max_per_slot_default"], "online_quota": seva["max_per_slot_default"]//2+2, "counter_quota": seva["max_per_slot_default"]//2})
    await db.schedule_slots.insert_many(slots)
    # Seed accommodations
    accommodations = [
        {"id": str(uuid.uuid4()), "name": "Siva Nilayam - AC Room", "name_telugu": "శివ నిలయం - ఏసీ రూమ్", "description": "Comfortable AC rooms with attached bathroom, hot water, and basic amenities", "room_type": "AC", "capacity": 3, "price_per_day": 800, "amenities": "AC, Attached Bathroom, Hot Water, TV, Bed Linen", "total_rooms": 10, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Parvathi Sadanam - Non-AC Room", "name_telugu": "పార్వతి సదనం - నాన్ ఏసీ రూమ్", "description": "Clean non-AC rooms with fan and attached bathroom", "room_type": "Non-AC", "capacity": 3, "price_per_day": 400, "amenities": "Fan, Attached Bathroom, Hot Water, Bed Linen", "total_rooms": 15, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Nandi Cottage", "name_telugu": "నంది కాటేజ్", "description": "Spacious cottage suitable for families with separate living area", "room_type": "Cottage", "capacity": 6, "price_per_day": 1500, "amenities": "AC, Kitchen, Living Room, 2 Bedrooms, Hot Water, TV", "total_rooms": 5, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Pilgrim Dormitory", "name_telugu": "యాత్రికుల డార్మిటరీ", "description": "Affordable dormitory beds for individual pilgrims", "room_type": "Dormitory", "capacity": 1, "price_per_day": 100, "amenities": "Fan, Common Bathroom, Locker", "total_rooms": 50, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.accommodations.insert_many(accommodations)
    # Seed news
    news_items = [
        {"id": str(uuid.uuid4()), "title": "Maha Shivaratri Brahmotsavams 2026", "title_telugu": "మహా శివరాత్రి బ్రహ్మోత్సవాలు 2026", "content": "Maha Shivaratri Brahmotsavams will be celebrated from February 20 to March 2, 2026. Special sevas and darshan timings will be announced soon. Devotees are requested to book accommodations in advance.", "content_telugu": "మహా శివరాత్రి బ్రహ్మోత్సవాలు ఫిబ్రవరి 20 నుండి మార్చి 2, 2026 వరకు జరుపబడతాయి. ప్రత్యేక సేవలు మరియు దర్శన సమయాలు త్వరలో ప్రకటించబడతాయి.", "is_important": True, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Online Booking Temporarily Paused", "title_telugu": "ఆన్‌లైన్ బుకింగ్ తాత్కాలికంగా నిలిపివేయబడింది", "content": "Online seva and accommodation booking is temporarily paused. Please contact the temple office directly to arrange sevas or accommodation until it resumes.", "content_telugu": "ఆన్‌లైన్ సేవ మరియు వసతి బుకింగ్ తాత్కాలికంగా నిలిపివేయబడింది. ఇది తిరిగి ప్రారంభమయ్యే వరకు దయచేసి నేరుగా దేవస్థాన కార్యాలయాన్ని సంప్రదించండి.", "is_important": True, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.news.insert_many(news_items)
    # Seed gallery
    gallery_items = [
        {"id": str(uuid.uuid4()), "title": "Sri Jadala Ramalingeshwara Swamy", "image_url": "/Assets/Sri_Swamy_Varu_1.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Parvathi Devi Ammavaru", "image_url": "/Assets/Parvati_Devi_1.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Main Temple, Atop the Hill", "image_url": "/Assets/Main_Temple_Full_View_Up_Hill.webp", "category": "Temple", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Parvathi Devi Temple, Foot of the Hill", "image_url": "/Assets/Parvati_Devi_Temple_Panoramic_View_Down_Hill.webp", "category": "Temple", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Parvathi Devi Temple - Aerial View", "image_url": "/Assets/Parvati_Devi_Temple_Top_View_Down_Hill.webp", "category": "Temple", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Moodu Gundlu Shivalingam", "image_url": "/Assets/Mudu_Gundlu_Shivalingam_6.webp", "category": "Temple", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Moodu Gundlu - Abhishekam", "image_url": "/Assets/Mudu_Gundlu_Shivalingam_2.webp", "category": "Seva", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Moodu Gundlu - Alankaram", "image_url": "/Assets/Mudu_Gundlu_Shivalingam_5.webp", "category": "Seva", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Mallikarjuna Swamy", "image_url": "/Assets/Mallikharjuna_Swamy_Down_Hill_1.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Subrahmanya Swamy", "image_url": "/Assets/Subrahmanya_Swamy_Down_Hill.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Bhadrakali Ammavaru", "image_url": "/Assets/Bhadrakali_Ammavaru_Down_Hill.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Veerabhadra Swamy", "image_url": "/Assets/Veerabhadra_Swamy_Down_Hill.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Vighneshwara Swamy", "image_url": "/Assets/Ganapati_Swamy_Down_Hill.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sri Anjaneya Swamy", "image_url": "/Assets/Anjaneya_Swamy_1.webp", "category": "Deities", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Brahmotsavam - Dhwajarohanam", "image_url": "/Assets/Brahmotsavam_Dhwajarohanam_1.webp", "category": "Festival", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Brahmotsavam - Pavalimpu Seva", "image_url": "/Assets/Brahmotsavam_Pavalimpu_Seva_Decoratin_1.webp", "category": "Festival", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Brahmotsavam - Pavalimpu Seva Mandapam", "image_url": "/Assets/Brahmotsavam_Pavalimpu_Seva_Decoratin_3.webp", "category": "Festival", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Brahmotsavam - Alankara Ganapati", "image_url": "/Assets/Brahmotsavam_Alankara_Ganapati_2026.webp", "category": "Festival", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Brahmotsavam - Cultural Performances", "image_url": "/Assets/Brahmotsavam_Cultural_Dance_1.webp", "category": "Festival", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Utsava Murthulu", "image_url": "/Assets/Utsava_Murthulu_1.webp", "category": "Festival", "media_type": "PHOTO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.gallery.insert_many(gallery_items)
    # Seed live streams
    live_streams = [
        {"id": str(uuid.uuid4()), "name": "Temple Live Darshan", "description": "24x7 live darshan from the main sanctum", "stream_url": "", "platform": "YouTube", "is_live": False, "schedule_info": "Coming soon"},
        {"id": str(uuid.uuid4()), "name": "Temple TV Channel", "description": "Devotional programs, bhajans, and temple events", "stream_url": "", "platform": "YouTube", "is_live": False, "schedule_info": "Coming soon"},
    ]
    await db.live_streams.insert_many(live_streams)
    # Seed visitor stats
    await db.visitor_stats.insert_one({"key": "main", "total_visitors": 12847, "todays_visitors": 42, "last_reset_date": datetime.now(IST).strftime("%Y-%m-%d")})
    # Seed today's panchangam
    today_str = datetime.now(IST).strftime("%Y-%m-%d")
    panchangam_today = {
        "id": str(uuid.uuid4()), "date": today_str,
        "vaaram": datetime.now(IST).strftime("%A"), "vaaram_telugu": "",
        "masa": "Karthika Masam", "masa_telugu": "కార్తీక మాసం",
        "paksha": "Shukla Paksha", "paksha_telugu": "శుక్ల పక్షం",
        "tithi": "Panchami", "tithi_telugu": "పంచమి",
        "nakshatra": "Rohini", "nakshatra_telugu": "రోహిణి",
        "yoga": "Siddhi", "yoga_telugu": "సిద్ధి",
        "karana": "Bava", "karana_telugu": "బవ",
        "sunrise": "06:12 AM", "sunset": "06:02 PM",
        "rahu_kalam": "10:30 AM - 12:00 PM", "yamagandam": "07:30 AM - 09:00 AM",
        "gulika_kalam": "01:30 PM - 03:00 PM", "abhijit_muhurtam": "11:48 AM - 12:36 PM",
        "special_note": "Sample entry - update daily from the admin panel.",
        "special_note_telugu": "నమూనా వివరాలు - దయచేసి అడ్మిన్ ప్యానెల్ నుండి ప్రతిరోజూ నవీకరించండి.",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.panchangam.insert_one(panchangam_today)
    # Seed live blog posts
    live_blog_posts = [
        {"id": str(uuid.uuid4()), "event_name": "Maha Shivaratri Brahmotsavams 2026", "event_name_telugu": "మహా శివరాత్రి బ్రహ్మోత్సవాలు 2026", "title": "Dhwajarohanam concludes successfully", "title_telugu": "ధ్వజారోహణం విజయవంతంగా ముగిసింది", "content": "The Brahmotsavams began this morning with the Dhwajarohanam ceremony atop the main temple, marking the formal start of the festival. Thousands of devotees gathered to witness the flag-hoisting ritual.", "content_telugu": "", "image_url": "/Assets/Brahmotsavam_Dhwajarohanam_1.webp", "is_pinned": True, "active_flag": True, "posted_at": datetime.now(timezone.utc).isoformat(), "posted_by": "Temple EO"},
        {"id": str(uuid.uuid4()), "event_name": "Maha Shivaratri Brahmotsavams 2026", "event_name_telugu": "మహా శివరాత్రి బ్రహ్మోత్సవాలు 2026", "title": "Evening cultural programs begin at 6 PM", "title_telugu": "", "content": "Cultural dance performances and devotional music programs will be held every evening at 6 PM near the Mukha Mandapam through the duration of the festival.", "content_telugu": "", "image_url": "/Assets/Brahmotsavam_Cultural_Dance_1.webp", "is_pinned": False, "active_flag": True, "posted_at": datetime.now(timezone.utc).isoformat(), "posted_by": "Temple EO"},
    ]
    await db.live_blog.insert_many(live_blog_posts)
    return {"message": "Seed data created successfully", "sevas": len(sevas), "profiles": len(profiles), "slots": len(slots), "accommodations": len(accommodations), "news": len(news_items), "gallery": len(gallery_items), "panchangam": 1, "live_blog": len(live_blog_posts)}

@api_router.get("/")
async def root():
    return {"message": "Sri Parvati Jadala Ramalingeshwara Swamy Devastanam API"}

app.include_router(api_router)
app.include_router(volunteer.router)
app.include_router(newsletter.router)
app.include_router(contact.router)

@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        from app.database.db import client
        client.close()
    except Exception:
        pass
