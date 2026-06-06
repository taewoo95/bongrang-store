import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Download, Camera, Check } from 'lucide-react'

// ── QR 코드 보기 (상품 관리에서 사용) ──────────────────────────
export function QRViewModal({ product, onClose }) {
  const qrValue = `inv-product:${product.id}`

  const handleDownload = () => {
    const svg = document.getElementById('product-qr-svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 340
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 300, 340)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 25, 20, 250, 250)
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(product.name, 150, 300)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '13px sans-serif'
      ctx.fillText(`${product.sellPrice.toLocaleString()}원`, 150, 322)
      const link = document.createElement('a')
      link.download = `QR_${product.name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>상품 QR 코드</h3>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}><X size={22} /></button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', marginBottom: '16px', display: 'inline-block' }}>
          <QRCodeSVG
            id="product-qr-svg"
            value={qrValue}
            size={200}
            bgColor="#f8fafc"
            fgColor="#1e293b"
            level="M"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{product.name}</div>
          <div style={{ fontSize: '14px', color: '#6366f1', marginTop: '4px' }}>{product.sellPrice.toLocaleString()}원</div>
        </div>

        <button
          onClick={handleDownload}
          style={{ width: '100%', background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Download size={18} /> QR 이미지 저장
        </button>
      </div>
    </div>
  )
}

// ── QR 스캔 (판매 입력에서 사용) ─────────────────────────────────
export function QRScanModal({ cart, onScanned, onClose }) {
  const [error, setError] = useState(null)
  const [lastScannedName, setLastScannedName] = useState(null)
  const mountedRef = useRef(true)
  const scannerRef = useRef(null)
  const cooldownRef = useRef(false)
  const containerId = 'qr-scan-container'

  useEffect(() => {
    mountedRef.current = true

    const start = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mountedRef.current) return

        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (!mountedRef.current || cooldownRef.current) return
            if (decodedText.startsWith('inv-product:')) {
              const productId = decodedText.replace('inv-product:', '')
              cooldownRef.current = true
              const name = onScanned(productId)
              if (mountedRef.current) setLastScannedName(name)
              // 1.5초 후 다시 스캔 가능
              setTimeout(() => { cooldownRef.current = false }, 1500)
            }
          },
          () => {}
        )
      } catch (e) {
        if (mountedRef.current) setError('카메라를 사용할 수 없어요. 권한을 허용해주세요.')
      }
    }

    start()

    return () => {
      mountedRef.current = false
      const scanner = scannerRef.current
      if (scanner) {
        scannerRef.current = null
        scanner.stop().catch(() => {})
      }
    }
  }, [])

  const handleClose = () => onClose()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#fff" />
            <span style={{ color: '#fff', fontSize: '17px', fontWeight: '700' }}>QR 코드 스캔</span>
          </div>
          <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div style={{ background: '#fee2e2', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', fontSize: '15px', marginBottom: '16px' }}>{error}</p>
            <button onClick={handleClose} style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '10px 20px', fontWeight: '600' }}>닫기</button>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', background: '#000' }}>
              <div id={containerId} style={{ width: '100%' }} />
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '220px', height: '220px', border: `2px solid ${lastScanned ? '#10b981' : '#6366f1'}`, borderRadius: '12px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', transition: 'border-color 0.2s' }} />
              </div>
            </div>

            {/* 안내 문구 */}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
              상품 QR 코드를 네모 안에 맞춰주세요
            </p>

            {/* 장바구니 목록 */}
            {cart.length > 0 && (
              <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '700' }}>
                    🛒 담은 상품 {cart.length}종
                  </span>
                  <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: '700' }}>
                    {cart.reduce((s, c) => s + c.unitPrice * c.qty, 0).toLocaleString()}원
                  </span>
                </div>
                <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {cart.map(c => (
                    <div key={c.product.id} style={{
                      padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: lastScannedName === c.product.name ? 'rgba(99,102,241,0.3)' : 'transparent',
                      transition: 'background 0.3s',
                    }}>
                      <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{c.product.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#6366f1', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>
                          {c.qty}개
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {(c.unitPrice * c.qty).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 완료 버튼 */}
            {cart.length > 0 && (
              <button
                onClick={handleClose}
                style={{ marginTop: '10px', width: '100%', background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Check size={18} /> 담기 완료 ({cart.reduce((s, c) => s + c.qty, 0)}개)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
