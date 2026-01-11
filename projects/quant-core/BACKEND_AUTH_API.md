# Backend Authentication API - Implementation Guide

## Database Connection

**Connection String:**
```
postgresql://neondb_owner:npg_J94cznClZpuD@ep-flat-bar-ahm8kof9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Database Setup

Run the SQL script in `database_schema.sql` to create the necessary tables:

```bash
psql 'postgresql://neondb_owner:npg_J94cznClZpuD@ep-flat-bar-ahm8kof9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f database_schema.sql
```

## Required Endpoints

### 1. POST `/api/auth/signup`

**Purpose**: Create a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response** (Success - 201):
```json
{
  "status": "success",
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response** (Error - 400):
```json
{
  "status": "error",
  "message": "Email already exists"
}
```

**Validation Rules**:
- Email must be valid and unique
- Password must be at least 8 characters
- Full name is required

### 2. POST `/api/auth/login`

**Purpose**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (Success - 200):
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response** (Error - 401):
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### 3. POST `/api/auth/logout`

**Purpose**: Logout user and invalidate token

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (Success - 200):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### 4. GET `/api/auth/me`

**Purpose**: Get current authenticated user information

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (Success - 200):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T12:00:00Z"
  }
}
```

**Response** (Error - 401):
```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

## FastAPI Implementation Example

```python
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Optional

app = FastAPI()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Database connection
DATABASE_URL = "postgresql://neondb_owner:npg_J94cznClZpuD@ep-flat-bar-ahm8kof9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

# Pydantic Models
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

# Utility Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# Endpoints
@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest, db = Depends(get_db)):
    # Validate password length
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (request.email,))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Insert user
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name)
        VALUES (%s, %s, %s)
        RETURNING id, email, full_name, created_at
    """, (request.email, password_hash, request.full_name))
    
    user = cursor.fetchone()
    db.commit()
    cursor.close()
    
    return {
        "status": "success",
        "message": "User created successfully",
        "user": dict(user)
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest, db = Depends(get_db)):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    # Get user by email
    cursor.execute("""
        SELECT id, email, password_hash, full_name, created_at, updated_at
        FROM users
        WHERE email = %s AND is_active = TRUE
    """, (request.email,))
    
    user = cursor.fetchone()
    
    if not user or not verify_password(request.password, user['password_hash']):
        cursor.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    cursor.execute("""
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (user['id'],))
    db.commit()
    
    # Create token
    token_data = {"sub": str(user['id']), "email": user['email']}
    token = create_access_token(token_data)
    
    # Remove password_hash from response
    user_dict = dict(user)
    del user_dict['password_hash']
    
    cursor.close()
    
    return {
        "status": "success",
        "token": token,
        "user": user_dict
    }

@app.post("/api/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    # Verify token
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    # Optionally: Invalidate token in database (if using sessions table)
    # For now, we'll just return success since JWT is stateless
    
    return {
        "status": "success",
        "message": "Logged out successfully"
    }

@app.get("/api/auth/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
):
    token = credentials.credentials
    
    # Verify token
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    # Get user
    cursor.execute("""
        SELECT id, email, full_name, created_at, updated_at, last_login
        FROM users
        WHERE id = %s AND is_active = TRUE
    """, (user_id,))
    
    user = cursor.fetchone()
    cursor.close()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return {
        "user": dict(user)
    }
```

## Required Dependencies

```bash
pip install fastapi uvicorn passlib[bcrypt] python-jose[cryptography] psycopg2-binary python-multipart
```

## Environment Variables

Create a `.env` file:

```env
SECRET_KEY=your-super-secret-key-change-this-in-production
DATABASE_URL=postgresql://neondb_owner:npg_J94cznClZpuD@ep-flat-bar-ahm8kof9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Security Best Practices

1. **Password Hashing**: Always use bcrypt or similar (already implemented)
2. **JWT Secret**: Use a strong, random secret key in production
3. **Token Expiration**: Set appropriate expiration times
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Implement rate limiting on auth endpoints
6. **Input Validation**: Validate all inputs (already done with Pydantic)
7. **SQL Injection**: Use parameterized queries (already done)
8. **CORS**: Configure CORS properly for your frontend domain

## Testing

### Sign Up
```bash
curl -X POST https://your-api.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123"
  }'
```

### Get Current User
```bash
curl -X GET https://your-api.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Notes

- The frontend expects the token to be returned in the login response
- The frontend sends the token in the `Authorization: Bearer <token>` header
- Tokens are stored in localStorage (consider using httpOnly cookies for better security)
- The database schema includes indexes for better query performance
- The `updated_at` field is automatically updated via trigger
