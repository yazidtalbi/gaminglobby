import { NextRequest, NextResponse } from 'next/server'
import Vibrant from 'node-vibrant'

// List of background colors to choose from
const BACKGROUND_COLORS = [
  { hex: '#844A8B', rgb: [132, 74, 139] }, // purple
  { hex: '#772C36', rgb: [119, 44, 54] },   // dark red
  { hex: '#454E56', rgb: [69, 78, 86] },    // dark gray
  { hex: '#2C7054', rgb: [44, 112, 84] },   // green
  { hex: '#83704A', rgb: [131, 112, 74] },  // brown
]

// Calculate Euclidean distance between two RGB colors
function colorDistance(rgb1: number[], rgb2: number[]): number {
  const [r1, g1, b1] = rgb1
  const [r2, g2, b2] = rgb2
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + 
    Math.pow(g2 - g1, 2) + 
    Math.pow(b2 - b1, 2)
  )
}

// Find the closest color from the list
function findClosestColor(extractedRgb: number[]): string {
  let closestColor = BACKGROUND_COLORS[0]
  let minDistance = colorDistance(extractedRgb, BACKGROUND_COLORS[0].rgb)

  for (const color of BACKGROUND_COLORS) {
    const distance = colorDistance(extractedRgb, color.rgb)
    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }

  return closestColor.hex
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
  }

  try {
    // Use node-vibrant to extract dominant color
    const palette = await Vibrant.from(imageUrl).getPalette()
    
    // Get the most vibrant color
    const vibrantColor = palette.Vibrant || palette.Muted || palette.DarkVibrant || palette.LightVibrant
    
    if (vibrantColor) {
      const rgb = vibrantColor.rgb
      const closestColor = findClosestColor(rgb)
      return NextResponse.json({ color: closestColor })
    }

    // Fallback
    return NextResponse.json({ color: BACKGROUND_COLORS[0].hex })
  } catch (error) {
    console.error('Color extraction error:', error)
    // Return fallback color
    return NextResponse.json({ color: BACKGROUND_COLORS[0].hex })
  }
}

