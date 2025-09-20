"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Maximize2, Download, RefreshCw } from "lucide-react"
import { useState } from "react"

interface InteractiveChartContainerProps {
  title: string
  description: string
  children: React.ReactNode
  isLoading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  onFullscreen?: () => void
}

export function InteractiveChartContainer({
  title,
  description,
  children,
  isLoading = false,
  onRefresh,
  onExport,
  onFullscreen,
}: InteractiveChartContainerProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="glass card-hover relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          </div>

          <div
            className={`flex items-center gap-2 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
          >
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="h-8 w-8 p-0">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
            {onExport && (
              <Button variant="ghost" size="sm" onClick={onExport} className="h-8 w-8 p-0">
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onFullscreen && (
              <Button variant="ghost" size="sm" onClick={onFullscreen} className="h-8 w-8 p-0">
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">{children}</CardContent>
    </Card>
  )
}
