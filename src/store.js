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
  sales.unshift({ ...sale, id: Date.now().toString() })
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
