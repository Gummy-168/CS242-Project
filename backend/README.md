# CS242 Backend

Backend สำหรับโปรเจกต์ **CS242** พัฒนาด้วย **FastAPI**, **SQLAlchemy**, **MySQL** และ **Docker**  
โปรเจกต์นี้รองรับทั้งการรันแบบ **Local** และการรันผ่าน **Docker Compose** เพื่อให้ทีมสามารถ clone ไปพัฒนาต่อได้สะดวกและใช้ environment ที่ใกล้เคียงกัน

---

## Project Structure

```bash
backend/
├── database.py
├── main.py
├── models.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Requirements

### กรณีรันแบบ Local
- Python 3.x
- pip

### กรณีรันแบบ Docker
- Docker Desktop

---

## Environment Setup

ก่อนเริ่มใช้งาน ให้สร้างไฟล์ `.env` จาก `.env.example`

### Windows Command Prompt
```bash
copy .env.example .env
```

### PowerShell
```powershell
Copy-Item .env.example .env
```

### ตัวอย่าง `.env.example`
```env
DB_HOST=db
DB_PORT=3306
DB_NAME=CS242db
DB_USER=root
DB_PASSWORD=your_password_here
```

### หมายเหตุ
- หากรันผ่าน `docker-compose` ให้ใช้ `DB_HOST=db`
- หากรันแบบ local และเชื่อมต่อ MySQL ที่ติดตั้งในเครื่อง อาจใช้ `DB_HOST=localhost`

---

## Install Dependencies (Local)

ติดตั้ง dependencies ผ่าน `requirements.txt`

```bash
pip install -r requirements.txt
```

---

## Run Locally

ใช้คำสั่งด้านล่างเพื่อรัน FastAPI แบบ local

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

เมื่อรันสำเร็จ จะเห็นข้อความประมาณนี้

```bash
Uvicorn running on http://0.0.0.0:8000
```

จากนั้นสามารถเปิดใช้งานผ่าน browser ได้ที่

- Main API: `http://localhost:8000/`
- Swagger Docs: `http://localhost:8000/docs`

---

## Run with Docker

### Build Image
```bash
docker build -t backend-CS242 .
```

### Run Container
```bash
docker run -d -p 8000:8000 --name backend-container backend-CS242
```

หลังจากรันแล้ว สามารถเข้าใช้งานได้ที่

- Main API: `http://localhost:8000/`
- Swagger Docs: `http://localhost:8000/docs`

---

## Run with Docker Compose

หากต้องการรัน **backend + MySQL** พร้อมกัน แนะนำให้ใช้ Docker Compose

### Run
```bash
docker compose up --build
```

### Run แบบ background
```bash
docker compose up --build -d
```

---

## Stop Docker Compose

```bash
docker compose down
```

---

## View Logs

### ดู log ของ backend
```bash
docker compose logs backend
```

### ดู log ของ MySQL
```bash
docker compose logs db
```

---

## Test Database Connection

หลังจากรันระบบแล้ว ให้เปิด Swagger Docs ที่

```text
http://localhost:8000/docs
```

จากนั้นทดสอบ endpoint ต่อไปนี้

- `GET /api/db-test`

หากเชื่อมต่อฐานข้อมูลสำเร็จ จะได้ response ประมาณนี้

```json
{
  "message": "MySQL connected successfully"
}
```

---

## Example `requirements.txt`

ตัวอย่าง dependencies ที่ใช้ในโปรเจกต์นี้

```txt
fastapi
uvicorn[standard]
sqlalchemy
pymysql
python-dotenv
cryptography
```

---

## Example `.gitignore`

ไฟล์และโฟลเดอร์ที่ไม่ควร push ขึ้น Git

```gitignore
myenv/
__pycache__/
*.pyc
.env
.vscode/
```

---

## Important Notes

- ไม่ควร push ไฟล์ `.env` ขึ้น Git
- ไม่ควร push virtual environment เช่น `myenv/`
- หากเพื่อน clone โปรเจกต์ไป ให้สร้าง `.env` ใหม่จาก `.env.example`
- หากใช้ Docker Compose เป็นหลัก เพื่อนไม่จำเป็นต้องติดตั้ง MySQL แยกในเครื่อง

---

## Setup for Team Members

หลังจาก clone โปรเจกต์ ให้ทำตามขั้นตอนต่อไปนี้

### Windows Command Prompt
```bash
git clone <repo-url>
cd backend
copy .env.example .env
docker compose up --build
```

### PowerShell
```powershell
git clone <repo-url>
cd backend
Copy-Item .env.example .env
docker compose up --build
```

---

## Useful Commands

### ตรวจสอบ Docker version
```bash
docker version
```

### ดู container ที่กำลังรันอยู่
```bash
docker ps
```

### ดูสถานะของ Docker Compose
```bash
docker compose ps
```

---

## Current API

### Database Test
- **GET** `/api/db-test`

ใช้สำหรับตรวจสอบว่า backend สามารถเชื่อมต่อกับ MySQL ได้สำเร็จหรือไม่

---

## Current Status

ปัจจุบัน backend สามารถทำงานได้ในส่วนต่อไปนี้

- รันด้วย FastAPI
- เชื่อมต่อกับ MySQL
- ใช้งานผ่าน Docker
- ใช้งานผ่าน Docker Compose
- ทดสอบผ่าน Swagger Docs ได้

---

## Next Steps

ขั้นตอนต่อไปที่เหมาะสำหรับการพัฒนาต่อ ได้แก่

- เพิ่ม models และ tables จริง
- พัฒนา CRUD endpoints
- เชื่อมต่อ backend กับ frontend
- เตรียมระบบสำหรับ deployment ขึ้น AWS