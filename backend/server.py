from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import httpx
import os
import uuid

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.gold_vault_db

# Collections
users_collection = db.users
sessions_collection = db.user_sessions
gold_prices_collection = db.gold_prices
orders_collection = db.orders
portfolio_collection = db.portfolio
vouchers_collection = db.vouchers
jewelry_collection = db.jewelry

# Pydantic Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    gold_balance: float = 0.0
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str]
    session_token: str

class GoldPrice(BaseModel):
    timestamp: datetime
    price_24k: float
    price_22k: float
    price_18k: float
    currency: str = "USD"

class OrderItem(BaseModel):
    item_id: str
    item_type: str  # "gold_bar", "jewelry", "voucher"
    name: str
    quantity: float
    price_per_unit: float
    total: float

class Order(BaseModel):
    order_id: str
    user_id: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"  # pending, processing, shipped, delivered
    created_at: datetime
    tracking_info: Optional[str] = None

class Portfolio(BaseModel):
    user_id: str
    gold_holdings: float = 0.0  # in grams
    total_invested: float = 0.0
    current_value: float = 0.0
    updated_at: datetime

class Voucher(BaseModel):
    voucher_id: str
    user_id: str
    amount: float
    recipient_name: str
    recipient_phone: str
    status: str = "pending"  # pending, sent, redeemed
    created_at: datetime
    redeemed_at: Optional[datetime] = None

class JewelryItem(BaseModel):
    item_id: str
    name: str
    name_ar: str
    description: str
    description_ar: str
    price: float
    weight_grams: float
    karat: int
    category: str  # necklace, ring, bracelet, earrings
    image_base64: Optional[str] = None
    in_stock: bool = True

# Auth Helper Functions
async def get_current_user(request: Request) -> Optional[User]:
    # Get session token from cookie or Authorization header
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session in database
    session = await sessions_collection.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check if session is expired (normalize timezone)
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at <= datetime.now(timezone.utc):
        await sessions_collection.delete_one({"session_token": session_token})
        return None
    
    # Get user data
    user_doc = await users_collection.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if user_doc:
        return User(**user_doc)
    
    return None

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# Auth Endpoints
@app.post("/api/auth/session")
async def exchange_session(request: Request, response: Response):
    try:
        data = await request.json()
        session_id = data.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        # Exchange session_id for user data from Emergent Auth
        async with httpx.AsyncClient() as http_client:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = auth_response.json()
        
        # Check if user exists
        existing_user = await users_collection.find_one(
            {"email": user_data["email"]},
            {"_id": 0}
        )
        
        if not existing_user:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "gold_balance": 0.0,
                "created_at": datetime.now(timezone.utc)
            }
            await users_collection.insert_one(new_user)
            
            # Create portfolio
            await portfolio_collection.insert_one({
                "user_id": user_id,
                "gold_holdings": 0.0,
                "total_invested": 0.0,
                "current_value": 0.0,
                "updated_at": datetime.now(timezone.utc)
            })
            
            user = User(**new_user)
        else:
            user = User(**existing_user)
        
        # Create session
        session_token = user_data["session_token"]
        await sessions_collection.insert_one({
            "user_id": user.user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        return SessionDataResponse(
            id=user.user_id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            session_token=session_token
        )
    
    except Exception as e:
        print(f"Session exchange error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/me")
async def get_me(request: Request):
    user = await require_auth(request)
    return user

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await sessions_collection.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# Gold Price Endpoints
@app.get("/api/gold/prices/current")
async def get_current_gold_price():
    try:
        # Try to get from cache (last 1 minute)
        cached_price = await gold_prices_collection.find_one(
            {},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        if cached_price:
            timestamp = cached_price["timestamp"]
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            
            # If less than 1 minute old, return cached
            if datetime.now(timezone.utc) - timestamp < timedelta(minutes=1):
                return cached_price
        
        # Fetch from GoldAPI.io (free tier)
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://www.goldapi.io/api/XAU/USD",
                headers={"x-access-token": "goldapi-demo-key"}  # Using demo key for now
            )
            
            if response.status_code == 200:
                data = response.json()
                price_per_oz_usd = data.get("price", 2000)  # Default fallback
                price_per_gram_usd = price_per_oz_usd / 31.1035  # Convert to grams
                
                # Convert to QAR (1 USD = 3.64 QAR)
                USD_TO_QAR = 3.64
                price_per_gram_qar = price_per_gram_usd * USD_TO_QAR
                
                # Calculate prices for different karats
                price_24k = price_per_gram_qar
                price_22k = price_per_gram_qar * (22/24)
                price_18k = price_per_gram_qar * (18/24)
                
                new_price = {
                    "timestamp": datetime.now(timezone.utc),
                    "price_24k": round(price_24k, 2),
                    "price_22k": round(price_22k, 2),
                    "price_18k": round(price_18k, 2),
                    "currency": "QAR"
                }
                
                await gold_prices_collection.insert_one(new_price)
                return {k: v for k, v in new_price.items() if k != "_id"}
    
    except Exception as e:
        print(f"Gold price fetch error: {str(e)}")
    
    # Return mock data if API fails or any exception occurs (in QAR)
    return {
        "timestamp": datetime.now(timezone.utc),
        "price_24k": 236.6,  # 65 USD * 3.64
        "price_22k": 216.9,  # 59.6 USD * 3.64
        "price_18k": 177.6,  # 48.8 USD * 3.64
        "currency": "QAR"
    }

@app.get("/api/gold/prices/historical")
async def get_historical_prices(days: int = 7):
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        prices = await gold_prices_collection.find(
            {"timestamp": {"$gte": start_date}},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        return prices
    except Exception as e:
        print(f"Historical prices error: {str(e)}")
        return []

# Order Endpoints
@app.post("/api/orders")
async def create_order(order_data: dict, request: Request):
    user = await require_auth(request)
    
    try:
        order_id = f"order_{uuid.uuid4().hex[:12]}"
        items = [OrderItem(**item) for item in order_data.get("items", [])]
        
        order = {
            "order_id": order_id,
            "user_id": user.user_id,
            "items": [item.model_dump() for item in items],
            "total_amount": order_data.get("total_amount", 0),
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
            "tracking_info": None
        }
        
        await orders_collection.insert_one(order)
        
        # Update portfolio if buying gold
        total_gold_grams = sum(
            item.quantity for item in items 
            if item.item_type == "gold_bar"
        )
        
        if total_gold_grams > 0:
            await portfolio_collection.update_one(
                {"user_id": user.user_id},
                {
                    "$inc": {
                        "gold_holdings": total_gold_grams,
                        "total_invested": order_data.get("total_amount", 0)
                    },
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
        
        return {k: v for k, v in order.items() if k != "_id"}
    
    except Exception as e:
        print(f"Create order error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders")
async def get_user_orders(request: Request):
    user = await require_auth(request)
    
    try:
        orders = await orders_collection.find(
            {"user_id": user.user_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return orders
    except Exception as e:
        print(f"Get orders error: {str(e)}")
        return []

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await require_auth(request)
    
    order = await orders_collection.find_one(
        {"order_id": order_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

# Portfolio Endpoints
@app.get("/api/portfolio")
async def get_portfolio(request: Request):
    user = await require_auth(request)
    
    portfolio = await portfolio_collection.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not portfolio:
        # Create new portfolio if doesn't exist
        portfolio = {
            "user_id": user.user_id,
            "gold_holdings": 0.0,
            "total_invested": 0.0,
            "current_value": 0.0,
            "updated_at": datetime.now(timezone.utc)
        }
        await portfolio_collection.insert_one(portfolio)
    
    # Calculate current value based on latest gold price
    current_price_data = await get_current_gold_price()
    if current_price_data and "price_24k" in current_price_data:
        current_value = portfolio["gold_holdings"] * current_price_data["price_24k"]
    else:
        current_value = portfolio.get("current_value", 0.0)
    
    # Update current value
    await portfolio_collection.update_one(
        {"user_id": user.user_id},
        {"$set": {"current_value": current_value, "updated_at": datetime.now(timezone.utc)}}
    )
    
    portfolio["current_value"] = current_value
    return {k: v for k, v in portfolio.items() if k != "_id"}

# Jewelry Endpoints
@app.get("/api/jewelry")
async def get_jewelry():
    jewelry_items = await jewelry_collection.find({}, {"_id": 0}).to_list(100)
    
    # If empty, seed with sample data
    if not jewelry_items:
        sample_items = [
            {
                "item_id": f"jewelry_{i}",
                "name": f"Gold {cat} {i}",
                "name_ar": f"{cat_ar} ذهبي {i}",
                "description": f"Beautiful 22K gold {cat}",
                "description_ar": f"{cat_ar} ذهبي عيار 22",
                "price": price,
                "weight_grams": weight,
                "karat": 22,
                "category": cat,
                "in_stock": True
            }
            for i, (cat, cat_ar, price, weight) in enumerate([
                ("necklace", "قلادة", 2500, 25),
                ("ring", "خاتم", 800, 8),
                ("bracelet", "سوار", 1800, 18),
                ("earrings", "أقراط", 1200, 12)
            ], 1)
        ]
        await jewelry_collection.insert_many(sample_items)
        jewelry_items = sample_items
    
    return jewelry_items

# Voucher Endpoints
@app.post("/api/vouchers")
async def create_voucher(voucher_data: dict, request: Request):
    user = await require_auth(request)
    
    voucher_id = f"voucher_{uuid.uuid4().hex[:12]}"
    voucher = {
        "voucher_id": voucher_id,
        "user_id": user.user_id,
        "amount": voucher_data.get("amount", 0),
        "recipient_name": voucher_data.get("recipient_name"),
        "recipient_phone": voucher_data.get("recipient_phone"),
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "redeemed_at": None
    }
    
    await vouchers_collection.insert_one(voucher)
    return {k: v for k, v in voucher.items() if k != "_id"}

@app.get("/api/vouchers")
async def get_user_vouchers(request: Request):
    user = await require_auth(request)
    
    vouchers = await vouchers_collection.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return vouchers

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)