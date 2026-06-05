// localStorage 기반 데이터 저장소

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

export function updateSale(id, data) {
  const sales = getSales()
  const idx = sales.findIndex(s => s.id === id)
  if (idx === -1) return
  const old = sales[idx]

  // 재고 차이 반영 (기존 수량 복구 후 새 수량 차감)
  if (old.productId === data.productId) {
    const diff = data.qty - old.qty
    if (diff > 0) deductStock(data.productId, diff)
    else if (diff < 0) restoreStock(data.productId, -diff)
  } else {
    restoreStock(old.productId, old.qty)
    deductStock(data.productId, data.qty)
  }

  sales[idx] = { ...old, ...data }
  saveSales(sales)
}
