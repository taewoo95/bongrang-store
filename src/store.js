/*
 * store.js 수정 이력
 * ─────────────────────────────────────────────
 * 2026-06-06 reorderCategories 함수 추가 (카테고리 순서 변경)
 * 2026-06-06 updateSale 수정 — data.productId 누락 시 old.productId 사용하도록 방어 처리
 *            재고 조정 로직 개선: 같은 상품이면 수량 차이만큼만 반영
 * 2026-06-06 뽑기 등수(GachaGrades) 및 뽑기 판매(GachaSales) 기능 추가
 */
// localStorage 기반 데이터 저장소

export function getCategories() {
  return JSON.parse(localStorage.getItem('categories') || '[]')
}

export function saveCategories(categories) {
  localStorage.setItem('categories', JSON.stringify(categories))
}

export function addCategory(name) {
  const categories = getCategories()
  if (categories.find(c => c.name === name)) throw new Error('이미 있는 카테고리예요.')
  const newCat = { id: `${Date.now()}-${Math.random().toString(36).slice(2,5)}`, name }
  categories.push(newCat)
  saveCategories(categories)
  return newCat
}

export function reorderCategories(categories) {
  saveCategories(categories)
}

export function deleteCategory(id) {
  // 해당 카테고리 소속 상품은 카테고리 없음으로 초기화
  const products = getProducts().map(p => p.categoryId === id ? { ...p, categoryId: null } : p)
  saveProducts(products)
  saveCategories(getCategories().filter(c => c.id !== id))
}

export function getProducts() {
  return JSON.parse(localStorage.getItem('products') || '[]')
}

export function saveProducts(products) {
  localStorage.setItem('products', JSON.stringify(products))
}

export function getSales() {
  return JSON.parse(localStorage.getItem('sales') || '[]')
}

export function saveSales(sales) {
  localStorage.setItem('sales', JSON.stringify(sales))
}

export function addSale(sale) {
  const sales = getSales()
  sales.unshift({ ...sale, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })
  saveSales(sales)
}

export function addProduct(product) {
  const products = getProducts()
  const newProduct = { ...product, id: Date.now().toString() }
  products.push(newProduct)
  saveProducts(products)
  return newProduct
}

export function updateProduct(id, data) {
  const products = getProducts()
  const idx = products.findIndex(p => p.id === id)
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...data }
    saveProducts(products)
  }
}

export function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id)
  saveProducts(products)
}

export function exportBackup({ newFile = false } = {}) {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    categories: getCategories(),
    products: getProducts(),
    sales: getSales(),
    gachaGrades: getGachaGrades(),
    gachaSales: getGachaSales(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = newFile ? `재고관리_백업_${date}.json` : `재고관리_백업.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!Array.isArray(data.products) || !Array.isArray(data.sales)) throw new Error('올바른 백업 파일이 아니에요.')
        if (data.products.length > 50000 || data.sales.length > 500000) throw new Error('백업 파일이 너무 커요.')
        // 카테고리·뽑기 데이터도 복원 (구버전 백업은 빈 배열로 처리)
        if (Array.isArray(data.categories)) saveCategories(data.categories)
        saveProducts(data.products)
        saveSales(data.sales)
        if (Array.isArray(data.gachaGrades)) saveGachaGrades(data.gachaGrades)
        if (Array.isArray(data.gachaSales)) saveGachaSales(data.gachaSales)
        resolve({ products: data.products.length, sales: data.sales.length, exportedAt: data.exportedAt })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}

export function deductStock(productId, qty) {
  const products = getProducts()
  const idx = products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    products[idx].stock = Math.max(0, (products[idx].stock || 0) - qty)
    saveProducts(products)
  }
}

export function restoreStock(productId, qty) {
  const products = getProducts()
  const idx = products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    products[idx].stock = (products[idx].stock || 0) + qty
    saveProducts(products)
  }
}

export function deleteSale(id) {
  const sales = getSales()
  const sale = sales.find(s => s.id === id)
  if (sale) restoreStock(sale.productId, sale.qty)
  saveSales(sales.filter(s => s.id !== id))
}

// ── 뽑기 등수 ──────────────────────────────────────────────────────
export function getGachaGrades() {
  return JSON.parse(localStorage.getItem('gachaGrades') || '[]')
}
export function saveGachaGrades(grades) {
  localStorage.setItem('gachaGrades', JSON.stringify(grades))
}
export function addGachaGrade({ name, allowance, price }) {
  const grades = getGachaGrades()
  if (grades.find(g => g.name === name)) throw new Error('이미 있는 등수예요.')
  const g = { id: `${Date.now()}-${Math.random().toString(36).slice(2,5)}`, name, allowance: Number(allowance), price: Number(price) }
  grades.push(g)
  saveGachaGrades(grades)
  return g
}
export function deleteGachaGrade(id) {
  saveGachaGrades(getGachaGrades().filter(g => g.id !== id))
}
export function updateGachaGrade(id, data) {
  const grades = getGachaGrades()
  const idx = grades.findIndex(g => g.id === id)
  if (idx !== -1) { grades[idx] = { ...grades[idx], ...data }; saveGachaGrades(grades) }
}

// ── 뽑기 판매 ──────────────────────────────────────────────────────
// gachaSale: { id, time, gradeName, gradePrice, products: [{productId, productName, qty, costPrice}] }
export function getGachaSales() {
  return JSON.parse(localStorage.getItem('gachaSales') || '[]')
}
export function saveGachaSales(sales) {
  localStorage.setItem('gachaSales', JSON.stringify(sales))
}
export function addGachaSale({ gradeName, gradePrice, products }) {
  const sales = getGachaSales()
  const sale = { id: `g-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, time: new Date().toISOString(), gradeName, gradePrice, products }
  sales.unshift(sale)
  saveGachaSales(sales)
  products.forEach(p => deductStock(p.productId, p.qty))
  return sale
}
export function deleteGachaSale(id) {
  const sales = getGachaSales()
  const sale = sales.find(s => s.id === id)
  if (sale) sale.products.forEach(p => restoreStock(p.productId, p.qty))
  saveGachaSales(sales.filter(s => s.id !== id))
}

export function updateSale(id, data) {
  const sales = getSales()
  const idx = sales.findIndex(s => s.id === id)
  if (idx === -1) return
  const old = sales[idx]

  const productId = data.productId ?? old.productId

  if (productId === old.productId) {
    // 같은 상품: 수량 차이만 재고 반영
    const diff = (data.qty ?? old.qty) - old.qty
    if (diff > 0) deductStock(productId, diff)
    else if (diff < 0) restoreStock(productId, -diff)
  } else {
    // 상품 변경: 기존 재고 복구 후 새 상품 차감
    restoreStock(old.productId, old.qty)
    deductStock(productId, data.qty ?? old.qty)
  }

  sales[idx] = { ...old, ...data, productId }
  saveSales(sales)
}
