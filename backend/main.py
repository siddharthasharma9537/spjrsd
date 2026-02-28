from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import hashlib
import jwt
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ.get('JWT_SECRET', 'temple-secret-key-2025')

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

# --- Helpers ---
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
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
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


# ==================== VOLUNTEER ROUTES ====================
@api_router.post("/volunteers")
async def register_volunteer(data: VolunteerRegister):
    existing = await db.volunteers.find_one({"mobile": data.mobile}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered as volunteer")
    vol = {"id": str(uuid.uuid4()), **data.model_dump(), "status": "Pending", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.volunteers.insert_one(vol)
    return {k: v for k, v in vol.items() if k != "_id"}

@api_router.get("/admin/volunteers")
async def admin_list_volunteers(user=Depends(get_current_admin)):
    return await db.volunteers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

# ==================== NEWSLETTER ROUTES ====================
@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(data: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"message": "Already subscribed"}
    await db.newsletter.insert_one({"id": str(uuid.uuid4()), "email": data.email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Subscribed successfully"}

# ==================== CONTACT ROUTES ====================
@api_router.post("/contact")
async def submit_contact(data: ContactMessage):
    msg = {"id": str(uuid.uuid4()), **data.model_dump(), "status": "New", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.contact_messages.insert_one(msg)
    return {k: v for k, v in msg.items() if k != "_id"}

@api_router.get("/admin/contact-messages")
async def admin_contact_messages(user=Depends(get_current_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

# ==================== VISITOR STATS ROUTES ====================
@api_router.get("/visitor-stats")
async def get_visitor_stats():
    stats = await db.visitor_stats.find_one({"key": "main"}, {"_id": 0})
    if not stats:
        stats = {"total_visitors": 12847, "todays_visitors": 0, "last_reset_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if stats.get("last_reset_date") != today:
        await db.visitor_stats.update_one({"key": "main"}, {"$set": {"todays_visitors": 0, "last_reset_date": today}}, upsert=True)
        stats["todays_visitors"] = 0
    return stats

@api_router.post("/visitor-stats/track")
async def track_visitor():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
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
        {"id": str(uuid.uuid4()), "name_english": "Abhishekam", "name_telugu": "అభిషేకం", "description": "Sacred bathing ritual of the deity with milk, water, honey and other holy substances", "base_price": 500, "duration_minutes": 45, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 10, "max_persons_per_ticket": 4, "special_instructions": "Please arrive 30 minutes before the scheduled time. Wear traditional attire.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Archana", "name_telugu": "అర్చన", "description": "Offering of flowers and chanting of sacred names of the deity", "base_price": 100, "duration_minutes": 20, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 25, "max_persons_per_ticket": 4, "special_instructions": "Bring flowers if possible. Temple also provides.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Kumkuma Archana", "name_telugu": "కుంకుమ అర్చన", "description": "Special archana performed with sacred kumkum powder", "base_price": 200, "duration_minutes": 30, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 15, "max_persons_per_ticket": 4, "special_instructions": "Available on all days. Special significance on Fridays.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Sahasranama Archana", "name_telugu": "సహస్రనామ అర్చన", "description": "Chanting of 1000 names of Lord Shiva during the puja", "base_price": 300, "duration_minutes": 60, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 8, "max_persons_per_ticket": 4, "special_instructions": "Full duration puja. Please be present throughout.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Kalyanam", "name_telugu": "కల్యాణం", "description": "Celestial marriage ceremony of Lord Shiva and Goddess Parvathi", "base_price": 1000, "duration_minutes": 90, "is_online_bookable": True, "is_paroksha_available": False, "max_per_slot_default": 5, "max_persons_per_ticket": 4, "special_instructions": "Special occasion puja. Bring traditional items as instructed.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name_english": "Rudra Abhishekam", "name_telugu": "రుద్ర అభిషేకం", "description": "Grand abhishekam with Rudra Namakam Chamakam chanting", "base_price": 750, "duration_minutes": 75, "is_online_bookable": True, "is_paroksha_available": True, "max_per_slot_default": 6, "max_persons_per_ticket": 4, "special_instructions": "Most auspicious on Mondays and Pradosham days.", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
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
        {"id": str(uuid.uuid4()), "title": "Online Seva Booking Now Available", "title_telugu": "ఆన్‌లైన్ సేవ బుకింగ్ ఇప్పుడు అందుబాటులో ఉంది", "content": "Devotees can now book sevas online through our website. All major sevas including Abhishekam, Archana, and Rudra Abhishekam are available for online booking.", "content_telugu": "భక్తులు ఇప్పుడు మా వెబ్‌సైట్ ద్వారా ఆన్‌లైన్‌లో సేవలను బుక్ చేసుకోవచ్చు.", "is_important": False, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Paroksha Seva for Devotees Worldwide", "title_telugu": "ప్రపంచవ్యాప్తంగా భక్తులకు పరోక్ష సేవ", "content": "Devotees who cannot visit the temple can now book Paroksha Seva. The priest will perform the seva on your behalf and prasadam will be sent to your address.", "content_telugu": "దేవాలయాన్ని సందర్శించలేని భక్తులు ఇప్పుడు పరోక్ష సేవను బుక్ చేసుకోవచ్చు.", "is_important": False, "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.news.insert_many(news_items)
    # Seed gallery
    gallery_items = [
        {"id": str(uuid.uuid4()), "title": "Temple Gopuram", "image_url": "https://images.unsplash.com/photo-1582560475093-6f09a3dc9739?auto=format&fit=crop&w=800&q=80", "category": "Temple", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sacred Shrine", "image_url": "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80", "category": "Temple", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Festival Celebrations", "image_url": "https://images.unsplash.com/photo-1716047270022-b01edb8022af?auto=format&fit=crop&w=800&q=80", "category": "Festival", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Devotee Gathering", "image_url": "https://images.unsplash.com/photo-1641666017082-02c741e2af4b?auto=format&fit=crop&w=800&q=80", "category": "Devotees", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Temple at Dusk", "image_url": "https://images.unsplash.com/photo-1690312021800-9b5991464fd2?auto=format&fit=crop&w=800&q=80", "category": "Temple", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Sacred Rituals", "image_url": "https://images.unsplash.com/photo-1567591370504-82a4d58d4349?auto=format&fit=crop&w=800&q=80", "category": "Seva", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.gallery.insert_many(gallery_items)
    # Seed live streams
    live_streams = [
        {"id": str(uuid.uuid4()), "name": "Temple Live Darshan", "description": "24x7 live darshan from the main sanctum", "stream_url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "platform": "YouTube", "is_live": True, "schedule_info": "24x7 Live"},
        {"id": str(uuid.uuid4()), "name": "Temple TV Channel", "description": "Devotional programs, bhajans, and temple events", "stream_url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "platform": "YouTube", "is_live": True, "schedule_info": "6 AM - 10 PM Daily"},
    ]
    await db.live_streams.insert_many(live_streams)
    # Seed visitor stats
    await db.visitor_stats.insert_one({"key": "main", "total_visitors": 12847, "todays_visitors": 42, "last_reset_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")})
    # Seed video gallery items
    video_gallery = [
        {"id": str(uuid.uuid4()), "title": "Maha Shivaratri Celebrations 2025", "image_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "media_url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "category": "Festival", "media_type": "VIDEO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Temple Documentary - Sacred Cheruvugattu", "image_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "media_url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "category": "Documentary", "media_type": "VIDEO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Daily Abhishekam Ritual", "image_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", "media_url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "category": "Seva", "media_type": "VIDEO", "active_flag": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.gallery.insert_many(video_gallery)
    return {"message": "Seed data created successfully", "sevas": len(sevas), "profiles": len(profiles), "slots": len(slots), "accommodations": len(accommodations), "news": len(news_items), "gallery": len(gallery_items) + len(video_gallery)}

@api_router.get("/")
async def root():
    return {"message": "Sri Parvati Jadala Ramalingeshwara Swamy Devastanam API"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
