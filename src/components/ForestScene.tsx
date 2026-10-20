import type { CSSProperties } from 'react'

/** Deterministic PRNG so the hero artwork is identical on every render. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTE = ['#4d6157', '#3a4f46', '#2c423a', '#21352f']
const LAYERS = [
  { scale: 0.55, spread: 0.75, y: 10 },
  { scale: 0.85, spread: 0.65, y: 24 },
  { scale: 1.1, spread: 0.5, y: 38 },
  { scale: 1.5, spread: 0.35, y: 52 },
]

interface Tree {
  x: number
  y: number
  scale: number
  fill: string
}

const TREES: Tree[] = LAYERS.flatMap((layer, layerIndex) => {
  const random = mulberry32(11 + layerIndex * 97)
  const count = 6 + Math.floor(random() * 3)
  return Array.from({ length: count }, () => ({
    x: -30 + random() * 460,
    y: layer.y,
    scale: layer.scale + random() * layer.spread,
    fill: PALETTE[layerIndex],
  }))
})

const FIREFLIES = [
  { cx: 252, cy: 420, r: 1.6, duration: 3.1, delay: 0 },
  { cx: 204, cy: 368, r: 1.3, duration: 2.6, delay: 0.4 },
  { cx: 310, cy: 452, r: 1.4, duration: 3.8, delay: 0.9 },
  { cx: 88, cy: 352, r: 1.2, duration: 2.9, delay: 1.3 },
  { cx: 272, cy: 330, r: 1, duration: 3.4, delay: 0.7 },
]

export function ForestScene() {
  return (
    <svg
      className="forest"
      viewBox="0 0 400 533"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="forest-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2f2b" />
          <stop offset=".55" stopColor="#223935" />
          <stop offset="1" stopColor="#2c443c" />
        </linearGradient>
        <radialGradient id="forest-moon">
          <stop offset="0" stopColor="#eddcae" stopOpacity=".95" />
          <stop offset=".45" stopColor="#e3cf9c" stopOpacity=".4" />
          <stop offset="1" stopColor="#e3cf9c" stopOpacity="0" />
        </radialGradient>
        <filter id="forest-soft">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="400" height="533" fill="url(#forest-sky)" />
      <circle cx="296" cy="92" r="60" fill="url(#forest-moon)" />
      <circle cx="296" cy="92" r="26" fill="#eddcae" opacity=".92" />
      <circle cx="120" cy="150" r="1.4" fill="#d9cd9f" opacity=".7" />
      <circle cx="348" cy="180" r="1.1" fill="#d9cd9f" opacity=".55" />
      <circle cx="86" cy="96" r="1" fill="#d9cd9f" opacity=".6" />
      <circle cx="232" cy="70" r="1.2" fill="#d9cd9f" opacity=".5" />

      {TREES.map((tree, index) => (
        <g
          key={index}
          transform={`translate(${tree.x.toFixed(1)} ${tree.y}) scale(${tree.scale.toFixed(3)})`}
          fill={tree.fill}
        >
          <path d="M0,-58 L30,-6 L-30,-6 Z" />
          <path d="M0,-28 L37,22 L-37,22 Z" />
          <path d="M0,4 L44,64 L-44,64 Z" />
          <rect x="-3" y="64" width="6" height="46" />
        </g>
      ))}

      <ellipse
        cx="128"
        cy="500"
        rx="58"
        ry="16"
        fill="#e8b35a"
        opacity=".18"
        filter="url(#forest-soft)"
      />
      <circle
        cx="128"
        cy="488"
        r="26"
        fill="#efbe6c"
        opacity=".34"
        filter="url(#forest-soft)"
      />
      <circle cx="128" cy="488" r="7" fill="#f4c87e" opacity=".9" />
      <rect x="125" y="492" width="6" height="30" fill="#162420" opacity=".9" />

      <g fill="#eddcae">
        {FIREFLIES.map((fly, index) => (
          <circle
            key={index}
            className="firefly"
            cx={fly.cx}
            cy={fly.cy}
            r={fly.r}
            style={
              {
                animationDuration: `${fly.duration}s`,
                animationDelay: `${fly.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </g>
    </svg>
  )
}
