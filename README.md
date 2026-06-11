# 🏪 소규모 매장 재고·판매 관리 PWA / Small Shop Inventory & Sales Manager

> 🇰🇷 [한국어](#한국어) | 🇺🇸 [English](#english)

---

## 한국어

### 소개
소규모 매장을 위한 **재고 관리 및 판매 기록 PWA**입니다.  
별도 서버 없이 기기 내 로컬 저장소(localStorage)에 데이터를 저장하며, 스마트폰에 설치해 오프라인에서도 사용할 수 있습니다.

특히 **뽑기(가챠) 판매**를 운영하는 매장에 최적화되어 있습니다.  
등급별 가격 설정, QR 코드 스캔, 판매 내역 필터링까지 뽑기 운영에 필요한 기능을 한 번에 관리할 수 있습니다. 🎰

### PWA란?
**PWA (Progressive Web App)** 는 웹사이트를 스마트폰 앱처럼 설치해서 사용할 수 있는 기술입니다.  
- 📲 홈 화면에 아이콘으로 추가 가능 (앱스토어 없이 설치)
- ✈️ 인터넷 없이도 오프라인으로 동작
- ⚡ 앱처럼 빠른 실행 속도
- 💾 별도 용량 차지 없이 가볍게 사용 가능

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

### 프로젝트 구조

| 파일 / 폴더 | 설명 |
|---|---|
| `public/` | 정적 파일 (아이콘, PWA 매니페스트 등) |
| `src/` | 앱 소스코드 전체 |
| `src/components/` | 화면별 컴포넌트 (상품관리, 판매, 내역 등) |
| `src/store.js` | localStorage 기반 데이터 저장·불러오기 로직 |
| `src/App.jsx` | 앱 루트 및 탭 네비게이션 |
| `index.html` | HTML 진입점 |
| `vite.config.js` | Vite 빌드 설정 및 PWA 플러그인 구성 |
| `package.json` | 프로젝트 의존성 및 실행 스크립트 |

---

## English

### Overview
A **lightweight inventory & sales management PWA** designed for small shops.  
All data is stored locally in the browser (localStorage) — no server or account required. Install it on your phone and use it offline.

Especially optimized for shops running **Gacha (blind box) sales**.  
Manage grade-based pricing, QR code scanning, and sales history filtering — everything you need for gacha operations in one place. 🎰

### What is a PWA?
**PWA (Progressive Web App)** is a technology that lets you install a website just like a native app on your smartphone.
- 📲 Add to home screen as an icon — no App Store needed
- ✈️ Works offline without an internet connection
- ⚡ Launches instantly, just like a native app
- 💾 Lightweight — takes up minimal storage

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

### Project Structure

| File / Folder | Description |
|---|---|
| `public/` | Static assets (icons, PWA manifest, etc.) |
| `src/` | All application source code |
| `src/components/` | Screen components (Products, Sales, History, etc.) |
| `src/store.js` | Data read/write logic using localStorage |
| `src/App.jsx` | App root and tab navigation |
| `index.html` | HTML entry point |
| `vite.config.js` | Vite build config and PWA plugin setup |
| `package.json` | Dependencies and run scripts |

---

## License
MIT
