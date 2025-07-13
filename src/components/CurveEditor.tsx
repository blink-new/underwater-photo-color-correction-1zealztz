import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { RotateCcw } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface CurveEditorProps {
  curve: number[]
  onChange: (curve: number[]) => void
  color: 'rgb' | 'red' | 'green' | 'blue'
  label: string
}

const CURVE_COLORS = {
  rgb: '#ffffff',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6'
}

const CURVE_BG_COLORS = {
  rgb: 'rgba(255, 255, 255, 0.1)',
  red: 'rgba(239, 68, 68, 0.1)',
  green: 'rgba(34, 197, 94, 0.1)',
  blue: 'rgba(59, 130, 246, 0.1)'
}

export function CurveEditor({ curve, onChange, color, label }: CurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  const CANVAS_SIZE = 200
  const PADDING = 20
  const GRID_SIZE = (CANVAS_SIZE - 2 * PADDING) / 4

  // Convert curve values (0-100) to canvas coordinates
  const valueToCanvas = useCallback((value: number, isY = false) => {
    const normalized = value / 100
    if (isY) {
      return CANVAS_SIZE - PADDING - normalized * (CANVAS_SIZE - 2 * PADDING)
    }
    return PADDING + normalized * (CANVAS_SIZE - 2 * PADDING)
  }, [])

  // Convert canvas coordinates to curve values (0-100)
  const canvasToValue = useCallback((coord: number, isY = false) => {
    if (isY) {
      const normalized = (CANVAS_SIZE - PADDING - coord) / (CANVAS_SIZE - 2 * PADDING)
      return Math.max(0, Math.min(100, normalized * 100))
    }
    const normalized = (coord - PADDING) / (CANVAS_SIZE - 2 * PADDING)
    return Math.max(0, Math.min(100, normalized * 100))
  }, [])

  // Get curve points for drawing
  const getCurvePoints = useCallback((): Point[] => {
    return curve.map((y, index) => ({
      x: valueToCanvas(index * 25),
      y: valueToCanvas(y, true)
    }))
  }, [curve, valueToCanvas])

  // Draw the curve editor
  const drawCurve = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Set canvas background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])

    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = PADDING + i * GRID_SIZE
      ctx.beginPath()
      ctx.moveTo(x, PADDING)
      ctx.lineTo(x, CANVAS_SIZE - PADDING)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = PADDING + i * GRID_SIZE
      ctx.beginPath()
      ctx.moveTo(PADDING, y)
      ctx.lineTo(CANVAS_SIZE - PADDING, y)
      ctx.stroke()
    }

    // Draw diagonal reference line
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#475569'
    ctx.beginPath()
    ctx.moveTo(PADDING, CANVAS_SIZE - PADDING)
    ctx.lineTo(CANVAS_SIZE - PADDING, PADDING)
    ctx.stroke()

    // Draw curve area background
    ctx.setLineDash([])
    const points = getCurvePoints()
    
    if (points.length > 1) {
      // Create smooth curve using bezier curves
      ctx.fillStyle = CURVE_BG_COLORS[color]
      ctx.beginPath()
      ctx.moveTo(PADDING, CANVAS_SIZE - PADDING)
      
      // Draw smooth curve through points
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const cp1x = current.x + (next.x - current.x) * 0.5
        const cp1y = current.y
        const cp2x = next.x - (next.x - current.x) * 0.5
        const cp2y = next.y
        
        if (i === 0) {
          ctx.lineTo(current.x, current.y)
        }
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y)
      }
      
      ctx.lineTo(CANVAS_SIZE - PADDING, CANVAS_SIZE - PADDING)
      ctx.closePath()
      ctx.fill()

      // Draw curve line
      ctx.strokeStyle = CURVE_COLORS[color]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const cp1x = current.x + (next.x - current.x) * 0.5
        const cp1y = current.y
        const cp2x = next.x - (next.x - current.x) * 0.5
        const cp2y = next.y
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y)
      }
      ctx.stroke()
    }

    // Draw control points
    points.forEach((point, index) => {
      const isHovered = hoveredIndex === index
      const isDraggingThis = isDragging && dragIndex === index
      
      // Point shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.beginPath()
      ctx.arc(point.x + 1, point.y + 1, isHovered || isDraggingThis ? 6 : 4, 0, 2 * Math.PI)
      ctx.fill()
      
      // Point background
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(point.x, point.y, isHovered || isDraggingThis ? 6 : 4, 0, 2 * Math.PI)
      ctx.fill()
      
      // Point border
      ctx.strokeStyle = CURVE_COLORS[color]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(point.x, point.y, isHovered || isDraggingThis ? 6 : 4, 0, 2 * Math.PI)
      ctx.stroke()
      
      // Point center
      if (isHovered || isDraggingThis) {
        ctx.fillStyle = CURVE_COLORS[color]
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    // Draw labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter'
    ctx.textAlign = 'center'
    
    // Input/Output labels
    ctx.fillText('0', PADDING, CANVAS_SIZE - 5)
    ctx.fillText('255', CANVAS_SIZE - PADDING, CANVAS_SIZE - 5)
    
    ctx.save()
    ctx.translate(8, CANVAS_SIZE - PADDING)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('0', 0, 0)
    ctx.restore()
    
    ctx.save()
    ctx.translate(8, PADDING)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('255', 0, 0)
    ctx.restore()
  }, [curve, color, hoveredIndex, isDragging, dragIndex, getCurvePoints])

  // Handle mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const points = getCurvePoints()
    
    // Check if clicking on a control point
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      
      if (distance <= 8) {
        setIsDragging(true)
        setDragIndex(i)
        return
      }
    }
  }, [getCurvePoints])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (isDragging && dragIndex >= 0) {
      // Update curve point
      const newY = canvasToValue(y, true)
      const newCurve = [...curve]
      newCurve[dragIndex] = newY
      onChange(newCurve)
    } else {
      // Check for hover
      const points = getCurvePoints()
      let newHoveredIndex = -1
      
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
        
        if (distance <= 8) {
          newHoveredIndex = i
          break
        }
      }
      
      setHoveredIndex(newHoveredIndex)
      canvas.style.cursor = newHoveredIndex >= 0 ? 'pointer' : 'default'
    }
  }, [isDragging, dragIndex, curve, onChange, canvasToValue, getCurvePoints])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragIndex(-1)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(-1)
    setIsDragging(false)
    setDragIndex(-1)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default'
    }
  }, [])

  const resetCurve = useCallback(() => {
    onChange([0, 25, 50, 75, 100])
  }, [onChange])

  useEffect(() => {
    drawCurve()
  }, [drawCurve])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ 
              borderColor: CURVE_COLORS[color],
              color: CURVE_COLORS[color]
            }}
          >
            {color.toUpperCase()}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetCurve}
          className="h-6 px-2"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border border-border rounded-lg bg-background cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
          
          {/* Input/Output value display */}
          {hoveredIndex >= 0 && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-popover border border-border rounded px-2 py-1 text-xs">
                Input: {hoveredIndex * 25} → Output: {Math.round(curve[hoveredIndex])}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Drag control points to adjust the curve
      </div>
    </div>
  )
}