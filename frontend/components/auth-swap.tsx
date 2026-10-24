'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

type View = 'login' | 'register'

export function AuthSwap() {
  const [view, setView] = useState<View>('login')
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const loginRef = useRef<HTMLDivElement>(null)
  const registerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = view === 'login' ? loginRef.current : registerRef.current
    if (!el) return
    const next = el.offsetHeight
    setHeight(next)
    const timer = setTimeout(() => setHeight('auto'), 520)
    return () => clearTimeout(timer)
  }, [view])

  return (
    <div
      className="relative overflow-hidden transition-[height] duration-500 ease-out"
      style={height === 'auto' ? undefined : { height }}
    >
      {/* Carte login (avant) */}
      <div
        ref={loginRef}
        className={cn(
          'transition-all duration-500 ease-out will-change-transform',
          view === 'login'
            ? 'relative opacity-100 translate-y-0'
            : 'pointer-events-none absolute inset-x-0 top-0 -translate-y-10 opacity-0',
        )}
      >
        <div key={`login-${view}`}>
          <LoginForm onRegister={() => setView('register')} />
        </div>
      </div>
      {/* Carte register (arrière — glisse depuis le bas) */}
      <div
        ref={registerRef}
        className={cn(
          'transition-all duration-500 ease-out will-change-transform',
          view === 'register'
            ? 'relative opacity-100 translate-y-0'
            : 'pointer-events-none absolute inset-x-0 top-0 translate-y-12 opacity-0',
        )}
      >
        <div key={`register-${view}`}>
          <RegisterForm onLogin={() => setView('login')} />
        </div>
      </div>
    </div>
  )
}