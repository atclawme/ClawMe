'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  spawnTime: number
}

const NODE_COUNT = 32
const CONNECTION_DISTANCE = 280
const SPAWN_INTERVAL = 350 // ms between new nodes
const APPEAR_DURATION = 1200 // ms for a node to fade in
const EDGE_GROWTH_DURATION = 800 // ms for a line to grow between nodes
const INITIAL_NODES = 6 // nodes to show immediately

const BOT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(113, 113, 122, 0.9)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 6V2H8" />
  <path d="M2 12h2" />
  <path d="M20 12h2" />
  <path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
  <path d="M9 11v2" />
  <path d="M15 11v2" />
</svg>
`.trim()

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iconRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Pre-load icon
    const img = new Image()
    const svgBlob = new Blob([BOT_SVG], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.src = url
    iconRef.current = img

    let animationId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const startTime = Date.now()

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: 14,
      spawnTime: i < INITIAL_NODES ? 0 : (i - INITIAL_NODES) * SPAWN_INTERVAL,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const currentTime = Date.now() - startTime

      // Reset alpha for edges
      ctx.globalAlpha = 1.0

      // Collision Detection and Resolution (Prevent Overlap)
      for (let i = 0; i < nodes.length; i++) {
        if (currentTime < nodes[i].spawnTime) continue
        
        for (let j = i + 1; j < nodes.length; j++) {
          if (currentTime < nodes[j].spawnTime) continue

          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = nodes[i].radius + nodes[j].radius + 10 // Add buffer to keep them apart

          if (dist < minDist) {
            // Simple elastic collision (swap velocities or bounce)
            const tempVx = nodes[i].vx
            const tempVy = nodes[i].vy
            nodes[i].vx = nodes[j].vx
            nodes[i].vy = nodes[j].vy
            nodes[j].vx = tempVx
            nodes[j].vy = tempVy

            // Push them apart slightly so they don't get stuck
            const overlap = minDist - dist
            const pushX = (dx / dist) * overlap / 2
            const pushY = (dy / dist) * overlap / 2
            nodes[i].x -= pushX
            nodes[i].y -= pushY
            nodes[j].x += pushX
            nodes[j].y += pushY
          }
        }
      }

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const edgeStartTime = Math.max(nodes[i].spawnTime, nodes[j].spawnTime)
          const timeSinceEdgeSpawn = currentTime - edgeStartTime
          
          if (timeSinceEdgeSpawn < 0) continue

          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < CONNECTION_DISTANCE && dist > (nodes[i].radius + nodes[j].radius)) {
            const growth = Math.min(1, timeSinceEdgeSpawn / EDGE_GROWTH_DURATION)
            const edgeAlpha = (1 - dist / CONNECTION_DISTANCE) * 0.40
            
            // Grow from the older node to the newer node
            const fromNode = nodes[i].spawnTime <= nodes[j].spawnTime ? nodes[i] : nodes[j]
            const toNode = nodes[i].spawnTime <= nodes[j].spawnTime ? nodes[j] : nodes[i]

            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
            const startX = fromNode.x + Math.cos(angle) * fromNode.radius
            const startY = fromNode.y + Math.sin(angle) * fromNode.radius
            
            const fullTargetX = toNode.x - Math.cos(angle) * toNode.radius
            const fullTargetY = toNode.y - Math.sin(angle) * toNode.radius

            const currentEndX = startX + (fullTargetX - startX) * growth
            const currentEndY = startY + (fullTargetY - startY) * growth

            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha})`
            ctx.lineWidth = 1.6
            ctx.moveTo(startX, startY)
            ctx.lineTo(currentEndX, currentEndY)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        const timeSinceSpawn = currentTime - node.spawnTime
        if (timeSinceSpawn < 0) return

        const nodeOpacity = Math.min(1, timeSinceSpawn / APPEAR_DURATION)

        // Draw background circle mask to hide edges crossing behind this icon
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + 2, 0, Math.PI * 2)
        ctx.fillStyle = '#0A0A0F'
        ctx.globalAlpha = nodeOpacity
        ctx.fill()

        if (iconRef.current?.complete) {
          const size = node.radius * 2
          ctx.globalAlpha = 0.4 * nodeOpacity
          ctx.drawImage(
            iconRef.current!,
            node.x - node.radius,
            node.y - node.radius,
            size,
            size
          )
        }
        
        // Move
        ctx.globalAlpha = 1.0 // Reset alpha for movement logic if needed (redundant but safe)
        node.x += node.vx
        node.y += node.vy

        // Wrap
        if (node.x < -node.radius) node.x = window.innerWidth + node.radius
        if (node.x > window.innerWidth + node.radius) node.x = -node.radius
        if (node.y < -node.radius) node.y = window.innerHeight + node.radius
        if (node.y > window.innerHeight + node.radius) node.y = -node.radius
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      URL.revokeObjectURL(url)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  )
}
