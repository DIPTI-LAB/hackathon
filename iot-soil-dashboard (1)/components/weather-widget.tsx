"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Sun, CloudRain, Wind } from "lucide-react"
import { useState } from "react"

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  condition: "sunny" | "cloudy" | "rainy"
  forecast: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 24,
    humidity: 65,
    windSpeed: 12,
    condition: "sunny",
    forecast: "Clear skies expected",
  })

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "sunny":
        return <Sun className="h-8 w-8 text-yellow-500" />
      case "cloudy":
        return <Cloud className="h-8 w-8 text-gray-500" />
      case "rainy":
        return <CloudRain className="h-8 w-8 text-blue-500" />
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />
    }
  }

  return (
    <Card className="glass card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {getWeatherIcon()}
          Local Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{weather.temperature}°C</div>
            <div className="text-xs text-muted-foreground capitalize">{weather.condition}</div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <Wind className="h-3 w-3" />
              {weather.windSpeed} km/h
            </div>
            <Badge variant="secondary" className="text-xs">
              {weather.humidity}% humidity
            </Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground border-t pt-2">{weather.forecast}</div>
      </CardContent>
    </Card>
  )
}
