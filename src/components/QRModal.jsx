import { useEffect, useRef, useState, useCallback } from 'react'
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
          <QRCodeSVG id="product-qr-svg" value={qrValue} size={200} bgColor="#f8fafc" fgColor="#1e293b" level="M" />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{product.name}</div>
          <div style={{ fontSize: '14px', color: '#6366f1', marginTop: '4px' }}>{product.sellPrice.toLocaleString()}원</div>
        </div>
        <button onClick={handleDownload} style={{ width: '100%', background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
  const [flash, setFlash] = useState(false)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const mountedRef = useRef(true)
  const cooldownRef = useRef(false)

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        const video = videoRef.current
        video.srcObject = stream
        await video.play()

        const jsQR = (await import('jsqr')).default

        const tick = () => {
          if (!mountedRef.current) return
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
            if (code && code.data.startsWith('inv-product:') && !cooldownRef.current) {
              const productId = code.data.replace('inv-product:', '')
              cooldownRef.current = true
              const name = onScanned(productId)
              if (mountedRef.current && name) {
                setLastScannedName(name)
                if (isIOS) {
                  setFlash(true)
                  setTimeout(() => setFlash(false), 150)
                } else {
                  navigator.vibrate?.(60)
                }
              }
              setTimeout(() => { cooldownRef.current = false }, 1500)
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (e) {
        if (mountedRef.current) setError('카메라를 사용할 수 없어요.\n브라우저에서 카메라 권한을 허용해주세요.')
      }
    }

    startCamera()

    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', zIndex: 300 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(0,0,0,0.6)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={20} color="#fff" />
          <span style={{ color: '#fff', fontSize: '17px', fontWeight: '700' }}>QR 코드 스캔</span>
        </div>
        <button
          onClick={() => { stopCamera(); onClose() }}
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={20} />
        </button>
      </div>

      {error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fee2e2', borderRadius: '16px', padding: '24px', textAlign: 'center', width: '100%', maxWidth: '320px' }}>
            <p style={{ color: '#ef4444', fontSize: '15px', marginBottom: '16px', whiteSpace: 'pre-line' }}>{error}</p>
            <button onClick={() => { stopCamera(); onClose() }} style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '10px 20px', fontWeight: '600' }}>닫기</button>
          </div>
        </div>
      ) : (
        <>
          {/* 카메라 뷰 */}
          <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* iOS 번쩍 효과 */}
          {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.45)', zIndex: 5, pointerEvents: 'none' }} />}

          {/* 스캔 가이드 오버레이 */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '240px', height: '240px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', borderRadius: '12px' }} />
              <div style={{ position: 'absolute', inset: 0, border: `3px solid ${lastScannedName ? '#10b981' : '#6366f1'}`, borderRadius: '12px', transition: 'border-color 0.2s' }} />
            </div>
          </div>

          {/* 하단 패널 */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center', marginBottom: cart.length > 0 ? '12px' : '0' }}>
              상품 QR 코드를 네모 안에 맞춰주세요
            </p>

            {/* 장바구니 목록 */}
            {cart.length > 0 && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>🛒 {cart.length}종 {cart.reduce((s,c)=>s+c.qty,0)}개</span>
                    <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: '700' }}>{cart.reduce((s,c)=>s+c.unitPrice*c.qty,0).toLocaleString()}원</span>
                  </div>
                  <div style={{ maxHeight: '130px', overflowY: 'auto' }}>
                    {cart.map(c => (
                      <div key={c.product.id} style={{
                        padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: lastScannedName === c.product.name ? 'rgba(99,102,241,0.35)' : 'transparent',
                        transition: 'background 0.3s',
                      }}>
                        <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{c.product.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#6366f1', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>{c.qty}개</span>
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{(c.unitPrice*c.qty).toLocaleString()}원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { stopCamera(); onClose() }}
                  style={{ width: '100%', background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Check size={18} /> 담기 완료 ({cart.reduce((s,c)=>s+c.qty,0)}개)
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
