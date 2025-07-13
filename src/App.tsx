import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Slider } from './components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Label } from './components/ui/label'
import { Separator } from './components/ui/separator'
import { Badge } from './components/ui/badge'
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut,
  Image as ImageIcon,
  Palette,
  Sliders,
  TrendingUp,
  Droplets,
  Sun,
  Contrast,
  Zap
} from 'lucide-react'

interface ColorAdjustments {
  temperature: number
  tint: number
  contrast: number
  saturation: number
  highlights: number
  midtones: number
  shadows: number
  whites: number
  blacks: number
  redCurve: number[]
  greenCurve: number[]
  blueCurve: number[]
  rgbCurve: number[]
  selectiveRed: number
  selectiveOrange: number
  selectiveYellow: number
  selectiveGreen: number
  selectiveCyan: number
  selectiveBlue: number
  selectiveMagenta: number
  saturationRed: number
  saturationOrange: number
  saturationYellow: number
  saturationGreen: number
  saturationCyan: number
  saturationBlue: number
  saturationMagenta: number
}

const defaultAdjustments: ColorAdjustments = {
  temperature: 0,
  tint: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  midtones: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  redCurve: [0, 25, 50, 75, 100],
  greenCurve: [0, 25, 50, 75, 100],
  blueCurve: [0, 25, 50, 75, 100],
  rgbCurve: [0, 25, 50, 75, 100],
  selectiveRed: 0,
  selectiveOrange: 0,
  selectiveYellow: 0,
  selectiveGreen: 0,
  selectiveCyan: 0,
  selectiveBlue: 0,
  selectiveMagenta: 0,
  saturationRed: 0,
  saturationOrange: 0,
  saturationYellow: 0,
  saturationGreen: 0,
  saturationCyan: 0,
  saturationBlue: 0,
  saturationMagenta: 0
}

const underwaterPresets = [
  {
    name: "Tropical Blue",
    adjustments: {
      ...defaultAdjustments,
      temperature: 15,
      tint: -10,
      contrast: 20,
      saturation: 25,
      highlights: -15,
      shadows: 20,
      selectiveBlue: -20,
      selectiveCyan: -15,
      saturationRed: 30,
      saturationOrange: 25
    }
  },
  {
    name: "Deep Sea",
    adjustments: {
      ...defaultAdjustments,
      temperature: 25,
      tint: -15,
      contrast: 30,
      saturation: 15,
      highlights: -25,
      shadows: 35,
      selectiveBlue: -30,
      selectiveCyan: -25,
      saturationRed: 40,
      saturationYellow: 20
    }
  },
  {
    name: "Coral Reef",
    adjustments: {
      ...defaultAdjustments,
      temperature: 10,
      tint: -5,
      contrast: 15,
      saturation: 35,
      highlights: -10,
      shadows: 15,
      selectiveBlue: -15,
      saturationRed: 25,
      saturationOrange: 30,
      saturationYellow: 20
    }
  }
]

function App() {
  const [image, setImage] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<ColorAdjustments>(defaultAdjustments)
  const [showBefore, setShowBefore] = useState(false)
  const [zoom, setZoom] = useState(100)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const applyAdjustments = useCallback(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      if (!showBefore) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]

          // Temperature adjustment
          if (adjustments.temperature !== 0) {
            const temp = adjustments.temperature / 100
            r = Math.min(255, Math.max(0, r + temp * 30))
            b = Math.min(255, Math.max(0, b - temp * 30))
          }

          // Tint adjustment
          if (adjustments.tint !== 0) {
            const tint = adjustments.tint / 100
            g = Math.min(255, Math.max(0, g + tint * 30))
          }

          // Contrast adjustment
          if (adjustments.contrast !== 0) {
            const contrast = (adjustments.contrast / 100) * 2.55
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
            r = Math.min(255, Math.max(0, factor * (r - 128) + 128))
            g = Math.min(255, Math.max(0, factor * (g - 128) + 128))
            b = Math.min(255, Math.max(0, factor * (b - 128) + 128))
          }

          // Saturation adjustment
          if (adjustments.saturation !== 0) {
            const sat = 1 + (adjustments.saturation / 100)
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            r = Math.min(255, Math.max(0, gray + sat * (r - gray)))
            g = Math.min(255, Math.max(0, gray + sat * (g - gray)))
            b = Math.min(255, Math.max(0, gray + sat * (b - gray)))
          }

          // Highlights, midtones, shadows
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          const normalizedLum = luminance / 255

          if (normalizedLum > 0.7 && adjustments.highlights !== 0) {
            const factor = 1 + (adjustments.highlights / 100)
            r = Math.min(255, Math.max(0, r * factor))
            g = Math.min(255, Math.max(0, g * factor))
            b = Math.min(255, Math.max(0, b * factor))
          } else if (normalizedLum >= 0.3 && normalizedLum <= 0.7 && adjustments.midtones !== 0) {
            const factor = 1 + (adjustments.midtones / 100)
            r = Math.min(255, Math.max(0, r * factor))
            g = Math.min(255, Math.max(0, g * factor))
            b = Math.min(255, Math.max(0, b * factor))
          } else if (normalizedLum < 0.3 && adjustments.shadows !== 0) {
            const factor = 1 + (adjustments.shadows / 100)
            r = Math.min(255, Math.max(0, r * factor))
            g = Math.min(255, Math.max(0, g * factor))
            b = Math.min(255, Math.max(0, b * factor))
          }

          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
        }

        ctx.putImageData(imageData, 0, 0)
      }
    }
    img.src = image
  }, [image, adjustments, showBefore])

  useEffect(() => {
    applyAdjustments()
  }, [applyAdjustments])

  const resetAdjustments = () => {
    setAdjustments(defaultAdjustments)
  }

  const applyPreset = (preset: typeof underwaterPresets[0]) => {
    setAdjustments(preset.adjustments)
  }

  const downloadImage = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'corrected-underwater-photo.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Underwater Photo Editor</h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              Professional
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBefore(!showBefore)}
              className="gap-2"
            >
              {showBefore ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBefore ? 'Show After' : 'Show Before'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAdjustments}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={downloadImage}
              disabled={!image}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-6">
            {!image ? (
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-12 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Underwater Photo</h3>
                  <p className="text-muted-foreground">
                    Click to select or drag and drop your underwater image
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          {image && (
            <div className="flex items-center justify-center gap-4 p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Adjustment Panels */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          <div className="p-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="text-xs">
                  <Sun className="h-3 w-3 mr-1" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="tone" className="text-xs">
                  <Contrast className="h-3 w-3 mr-1" />
                  Tone
                </TabsTrigger>
                <TabsTrigger value="curves" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Curves
                </TabsTrigger>
                <TabsTrigger value="color" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  Color
                </TabsTrigger>
              </TabsList>

              {/* Presets */}
              <div className="mt-6">
                <Label className="text-sm font-medium mb-3 block">Underwater Presets</Label>
                <div className="grid grid-cols-1 gap-2">
                  {underwaterPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="justify-start"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <TabsContent value="basic" className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Temperature</Label>
                  <Slider
                    value={[adjustments.temperature]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, temperature: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Cool</span>
                    <span>{adjustments.temperature}</span>
                    <span>Warm</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Tint</Label>
                  <Slider
                    value={[adjustments.tint]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, tint: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Magenta</span>
                    <span>{adjustments.tint}</span>
                    <span>Green</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Contrast</Label>
                  <Slider
                    value={[adjustments.contrast]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, contrast: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.contrast}</span>
                    <span>+100</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Saturation</Label>
                  <Slider
                    value={[adjustments.saturation]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, saturation: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.saturation}</span>
                    <span>+100</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tone" className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Highlights</Label>
                  <Slider
                    value={[adjustments.highlights]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, highlights: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.highlights}</span>
                    <span>+100</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Midtones</Label>
                  <Slider
                    value={[adjustments.midtones]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, midtones: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.midtones}</span>
                    <span>+100</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Shadows</Label>
                  <Slider
                    value={[adjustments.shadows]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, shadows: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.shadows}</span>
                    <span>+100</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Whites</Label>
                  <Slider
                    value={[adjustments.whites]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, whites: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.whites}</span>
                    <span>+100</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Blacks</Label>
                  <Slider
                    value={[adjustments.blacks]}
                    onValueChange={([value]) => 
                      setAdjustments(prev => ({ ...prev, blacks: value }))
                    }
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>{adjustments.blacks}</span>
                    <span>+100</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="curves" className="space-y-6">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">RGB Curve Editor</p>
                  <p className="text-xs">Coming in next update</p>
                </div>
              </TabsContent>

              <TabsContent value="color" className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Selective Color Tinting</Label>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Red</Label>
                      <Slider
                        value={[adjustments.selectiveRed]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, selectiveRed: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Orange</Label>
                      <Slider
                        value={[adjustments.selectiveOrange]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, selectiveOrange: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Blue</Label>
                      <Slider
                        value={[adjustments.selectiveBlue]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, selectiveBlue: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Cyan</Label>
                      <Slider
                        value={[adjustments.selectiveCyan]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, selectiveCyan: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Saturation by Color</Label>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Red Saturation</Label>
                      <Slider
                        value={[adjustments.saturationRed]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, saturationRed: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Orange Saturation</Label>
                      <Slider
                        value={[adjustments.saturationOrange]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, saturationOrange: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Yellow Saturation</Label>
                      <Slider
                        value={[adjustments.saturationYellow]}
                        onValueChange={([value]) => 
                          setAdjustments(prev => ({ ...prev, saturationYellow: value }))
                        }
                        min={-100}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App