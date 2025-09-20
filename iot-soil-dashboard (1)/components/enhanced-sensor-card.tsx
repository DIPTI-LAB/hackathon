"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useState, useEffect } from "react"

interface EnhancedSensorCardProps {
  title: string
  value: number
  unit: string
  icon: React.ReactNode
  status: { status: string; color: string }
  timestamp: Date
  trend?: "up" | "down" | "stable"
  trendValue?: number
  optimal?: { min: number; max: number }
  chartColor: string
}

export function EnhancedSensorCard({
  title,
  value,
  unit,
  icon,
  status,
  timestamp,
  trend,
  trendValue,
  optimal,
  chartColor,
}: EnhancedSensorCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const duration = 1000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setAnimatedValue(value)
        clearInterval(timer)
      } else {
        setAnimatedValue(current)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const getOptimalProgress = () => {
    if (!optimal) return 50
    const range = optimal.max - optimal.min
    const position = ((value - optimal.min) / range) * 100
    return Math.max(0, Math.min(100, position))
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <Card
      className={`glass card-hover floating relative overflow-hidden transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${chartColor}22, transparent)`,
        }}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-card-foreground">{title}</CardTitle>
        <div className="relative">
          {icon}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full status-indicator" />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-card-foreground">{animatedValue.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>

          {optimal && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Optimal Range</span>
                <span>
                  {optimal.min}-{optimal.max} {unit}
                </span>
              </div>
              <Progress
                value={getOptimalProgress()}
                className="h-2"
                style={{
                  background: `linear-gradient(90deg, ${chartColor}20, ${chartColor}40, ${chartColor}20)`,
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${status.color} text-white text-xs px-2 py-1`}>{status.status}</Badge>
              {trend && trendValue && (
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon()}
                  <span
                    className={trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"}
                  >
                    {trendValue > 0 ? "+" : ""}
                    {trendValue.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
