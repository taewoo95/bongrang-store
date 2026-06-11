# 📦 Inventory App — 재고 & 판매 관리 앱

> 🇰🇷 [한국어](#한국어) | 🇺🇸 [English](#english)

---

## 한국어

### 소개
소규모 매장을 위한 **재고 관리 및 판매 기록 PWA**입니다.  
별도 서버 없이 기기 내 로컬 저장소(localStorage)에 데이터를 저장하며, 스마트폰에 설치해 오프라인에서도 사용할 수 있습니다.

### 주요 기능
- 📋 **상품 관리** — 상품 등록·수정·삭제, 카테고리별 분류, 재고 부족 알림
- 🗂️ **카테고리 관리** — 카테고리 추가·삭제, 길게 눌러 순서 드래그 변경
- 🛒 **일반 판매** — 상품 선택 후 판매 수량 입력, QR 코드 스캔으로 빠른 등록
- 🎰 **뽑기 판매** — 등급별 가격 설정, QR 코드 스캔 지원
- 📊 **판매 내역** — 날짜별 조회, 일반·뽑기 필터, 총 매출 확인
- 📷 **QR 코드** — 상품마다 QR 코드 생성·인식 지원
- 📱 **PWA** — 홈 화면에 설치 가능, 오프라인 동작

### 기술 스택
- **React 19** + **Vite 8**
- **PWA** (vite-plugin-pwa / Workbox)
- **localStorage** 기반 데이터 저장 (서버 불필요)
- **Lucide React** 아이콘

### 데모
🌐 **[라이브 데모 보기](https://inventory-app-bongrang.vercel.app)**

---

## English

### Overview
A **lightweight inventory & sales management PWA** designed for small shops.  
All data is stored locally in the browser (localStorage) — no server or account required. Install it on your phone and use it offline.

### Features
- 📋 **Product Management** — Add, edit, and delete products with category support and low-stock alerts
- 🗂️ **Category Management** — Create/delete categories, reorder by long-press drag
- 🛒 **Regular Sales** — Select products, enter quantity, or scan QR codes for quick input
- 🎰 **Gacha Sales** — Grade-based pricing with QR scan support
- 📊 **Sales History** — Browse by date, filter by type (regular / gacha), view total revenue
- 📷 **QR Codes** — Generate and scan QR codes per product
- 📱 **PWA** — Installable on home screen, works offline

### Tech Stack
- **React 19** + **Vite 8**
- **PWA** (vite-plugin-pwa / Workbox)
- **localStorage** for data persistence (no backend needed)
- **Lucide React** icons

### Live Demo
🌐 **[View Live Demo](https://inventory-app-bongrang.vercel.app)**

---

## License
MIT
