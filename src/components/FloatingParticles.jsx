// src/components/FloatingParticles.jsx
// Elemen background bergerak perlahan agar tidak terlalu polos

import { useEffect, useState } from 'react'

const SHAPES = [
  { type: 'circle', size: 6 },
  { type: 'circle', size: 4 },
  { type: 'circle', size: 8 },
  { type: 'diamond', size: 5 },
  { type: 'circle', size: 3 },
  { type: 'diamond', size: 7 },
  { type: 'circle', size: 5 },
  { type: 'circle', size: 4 },
]

export default function FloatingParticles() {
  const [particles] = useState(() =>
    SHAPES.map((s, i) => ({
      ...s,
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 18 + Math.random() * 14,
      opacity: 0.04 + Math.random() * 0.06,
    }))
  )

  return (
    <div className="floating-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className={`particle particle-${p.type}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
