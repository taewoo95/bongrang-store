import { createContext, useContext, useState } from 'react'
import translations from './translations'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'ko')

  const setLang = (l) => {
    localStorage.setItem('lang', l)
    setLangState(l)
  }

  const tr = translations[lang]

  // 번역 함수: 문자열이면 그대로, 함수면 인자 전달
  const t = (key, ...args) => {
    const val = tr[key]
    if (val === undefined) return key
    return typeof val === 'function' ? val(...args) : val
  }

  // 금액 포맷: ko=원, en=$
  const fmt = (amount) =>
    lang === 'en'
      ? `$${Number(amount).toLocaleString('en-US')}`
      : `${Number(amount).toLocaleString('ko-KR')}원`

  return (
    <LangContext.Provider value={{ lang, setLang, t, fmt }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
