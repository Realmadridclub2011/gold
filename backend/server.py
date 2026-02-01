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

# Load environment variables
GOLDAPI_KEY = os.getenv("GOLDAPI_KEY", "goldapi-demo-key")

# Cache for gold prices (QAR endpoint)
gold_qar_cache = {
    "data": None,
    "timestamp": None
}

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
stores_collection = db.stores  # New collection

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
    currency: str = "QAR"

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
    store_id: str  # New field
    store_name: str  # New field
    name: str
    name_ar: str
    description: str
    description_ar: str
    price: float
    weight_grams: float
    karat: int
    category: str  # necklace, ring, bracelet, earrings
    image_url: Optional[str] = None  # Changed from base64 to URL
    in_stock: bool = True

class Store(BaseModel):
    store_id: str
    name: str
    name_ar: str
    description: str
    description_ar: str
    logo_url: Optional[str] = None
    rating: float = 4.5
    total_products: int = 0
    location: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool = True

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
        
        # Fetch from FreeGoldAPI (completely free, no API key needed)
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://freegoldapi.com/data/latest.json",
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                # Get latest price from array
                if data and len(data) > 0:
                    latest = data[-1]  # Last item is most recent
                    price_per_oz_usd = float(latest.get("price", 2000))
                else:
                    price_per_oz_usd = 2000
                
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
                    "currency": "QAR",
                    "source": "FreeGoldAPI"
                }
                
                await gold_prices_collection.insert_one(new_price)
                return {k: v for k, v in new_price.items() if k != "_id"}
            else:
                raise Exception(f"API returned status {response.status_code}")
    
    except Exception as e:
        print(f"Gold price fetch error: {str(e)}")
    
    # Return mock data if API fails or any exception occurs (in QAR)
    return {
        "timestamp": datetime.now(timezone.utc),
        "price_24k": 236.6,  # Fallback based on typical gold prices
        "price_22k": 216.9,
        "price_18k": 177.6,
        "currency": "QAR",
        "source": "fallback"
    }

@app.get("/api/gold/qar")
async def get_live_gold_price_qar():
    """
    Fetch REAL-TIME spot gold price in QAR.
    Uses free APIs without authentication:
    - FreeGoldAPI.com for gold prices (XAU/USD)
    - open.er-api.com for USD to QAR conversion
    Implements 60-second caching to reduce API calls.
    """
    try:
        # Check cache (60 seconds)
        if gold_qar_cache["data"] and gold_qar_cache["timestamp"]:
            cache_age = (datetime.now(timezone.utc) - gold_qar_cache["timestamp"]).total_seconds()
            if cache_age < 60:
                return gold_qar_cache["data"]
        
        async with httpx.AsyncClient() as http_client:
            # Get gold price in USD from FreeGoldAPI
            gold_response = await http_client.get(
                "https://freegoldapi.com/data/latest.json",
                timeout=10.0
            )
            
            if gold_response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"FreeGoldAPI returned status {gold_response.status_code}"
                )
            
            gold_data = gold_response.json()
            
            # Get the latest gold price
            if not gold_data or len(gold_data) == 0:
                raise HTTPException(
                    status_code=502,
                    detail="No gold price data received from FreeGoldAPI"
                )
            
            latest_gold = gold_data[-1]  # Most recent entry
            ounce_usd = float(latest_gold.get("price", 0))
            
            if ounce_usd == 0:
                raise HTTPException(
                    status_code=502,
                    detail="Invalid gold price received from FreeGoldAPI"
                )
            
            # Get USD to QAR exchange rate from Open Exchange Rates API (free, no key needed)
            exchange_response = await http_client.get(
                "https://open.er-api.com/v6/latest/USD",
                timeout=10.0
            )
            
            if exchange_response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Exchange Rate API returned status {exchange_response.status_code}"
                )
            
            exchange_data = exchange_response.json()
            usd_to_qar = float(exchange_data.get("rates", {}).get("QAR", 3.64))
            
            # Calculate prices
            ounce_qar = ounce_usd * usd_to_qar
            gram_qar = ounce_qar / 31.1034768
            
            # Prepare response
            response_data = {
                "source": "FreeGoldAPI + OpenExchangeRates",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ounceUSD": round(ounce_usd, 2),
                "usdToQar": round(usd_to_qar, 4),
                "ounceQAR": round(ounce_qar, 2),
                "gramQAR": round(gram_qar, 2),
                "goldDate": latest_gold.get("date", "N/A")
            }
            
            # Update cache
            gold_qar_cache["data"] = response_data
            gold_qar_cache["timestamp"] = datetime.now(timezone.utc)
            
            return response_data
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching live gold price in QAR: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch live gold prices: {str(e)}"
        )


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

# Stores Endpoints
@app.get("/api/stores")
async def get_stores():
    """Get all jewelry stores"""
    stores = await stores_collection.find({}, {"_id": 0}).to_list(100)
    
    # If empty, seed with sample data
    if not stores:
        sample_stores = [
            {
                "store_id": "store_1",
                "name": "Lazurde Jewelry",
                "name_ar": "لازوردي للمجوهرات",
                "description": "Premium gold jewelry store",
                "description_ar": "محل مجوهرات ذهبية فاخرة",
                "rating": 4.8,
                "total_products": 45,
                "location": "Doha, Qatar",
                "phone": "+974 4444 5555",
                "is_verified": True
            },
            {
                "store_id": "store_2",
                "name": "Damas Jewellery",
                "name_ar": "داماس للمجوهرات",
                "description": "Luxury jewelry collection",
                "description_ar": "تشكيلة مجوهرات راقية",
                "rating": 4.7,
                "total_products": 38,
                "location": "The Pearl, Doha",
                "phone": "+974 4444 6666",
                "is_verified": True
            },
            {
                "store_id": "store_3",
                "name": "Al Fardan Jewellery",
                "name_ar": "الفردان للمجوهرات",
                "description": "Fine gold and diamond jewelry",
                "description_ar": "مجوهرات ذهبية وماسية فاخرة",
                "rating": 4.9,
                "total_products": 52,
                "location": "Katara, Doha",
                "phone": "+974 4444 7777",
                "is_verified": True
            },
            {
                "store_id": "store_4",
                "name": "Gold Souk",
                "name_ar": "سوق الذهب",
                "description": "Traditional gold market",
                "description_ar": "سوق الذهب التقليدي",
                "rating": 4.5,
                "total_products": 68,
                "location": "Souq Waqif, Doha",
                "phone": "+974 4444 8888",
                "is_verified": True
            }
        ]
        await stores_collection.insert_many(sample_stores)
        stores = sample_stores
    
    return stores

@app.get("/api/stores/{store_id}")
async def get_store(store_id: str):
    """Get specific store details"""
    store = await stores_collection.find_one(
        {"store_id": store_id},
        {"_id": 0}
    )
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return store

@app.get("/api/stores/{store_id}/products")
async def get_store_products(store_id: str):
    """Get all products from a specific store"""
    # Check if store exists
    store = await stores_collection.find_one(
        {"store_id": store_id},
        {"_id": 0}
    )
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Get products
    products = await jewelry_collection.find(
        {"store_id": store_id},
        {"_id": 0}
    ).to_list(100)
    
    # If empty, seed with sample products
    if not products:
        jewelry_images = {
            "necklace": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
            "ring": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400",
            "bracelet": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400",
            "earrings": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400",
        }
        
        store_name = store.get("name_ar", "محل مجوهرات")
        
        sample_products = []
        product_templates = [
            ("necklace", "قلادة", "قلادة ذهبية فاخرة", [20, 25, 30], [22, 24], [2800, 3200, 3600, 4200]),
            ("ring", "خاتم", "خاتم ذهبي أنيق", [5, 7, 10], [18, 22, 24], [800, 1200, 1600, 2000]),
            ("bracelet", "سوار", "سوار ذهبي راقي", [15, 18, 22], [18, 22], [2000, 2400, 2800, 3200]),
            ("earrings", "أقراط", "أقراط ذهبية مميزة", [8, 10, 12], [18, 22], [1200, 1500, 1800, 2200]),
        ]
        
        for category, cat_ar, desc_ar, weights, karats, prices in product_templates:
            for i in range(3):  # 3 products per category
                weight = weights[i % len(weights)]
                karat = karats[i % len(karats)]
                price = prices[i % len(prices)]
                
                product = {
                    "item_id": f"{store_id}_{category}_{i+1}",
                    "store_id": store_id,
                    "store_name": store_name,
                    "name": f"Gold {category.title()} {i+1}",
                    "name_ar": f"{cat_ar} {store_name} - {i+1}",
                    "description": f"Beautiful {karat}K gold {category}",
                    "description_ar": f"{desc_ar} عيار {karat} من {store_name}",
                    "price": price,
                    "weight_grams": weight,
                    "karat": karat,
                    "category": category,
                    "image_url": jewelry_images[category],
                    "in_stock": True,
                    "rating": round(4.3 + (i * 0.2), 1)
                }
                sample_products.append(product)
        
        await jewelry_collection.insert_many(sample_products)
        products = sample_products
    
    return products

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)