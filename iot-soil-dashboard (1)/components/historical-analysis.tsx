"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, BarChart3, Target, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts"
import type { HistoricalData, SensorReading } from "@/lib/thingspeak"

interface HistoricalAnalysisProps {
  historicalData: HistoricalData[]
  currentData: SensorReading
}

interface TrendAnalysis {
  metric: string
  trend: "up" | "down" | "stable"
  change: number
  prediction: number
  status: "good" | "warning" | "critical"
  recommendation: string
}

interface StatisticalSummary {
  metric: string
  current: number
  average: number
  min: number
  max: number
  stdDev: number
  unit: string
}

export function HistoricalAnalysis({ historicalData, currentData }: HistoricalAnalysisProps) {
  // Calculate statistical summaries
  const statisticalSummaries = useMemo((): StatisticalSummary[] => {
    if (historicalData.length === 0) return []

    const calculateStats = (values: number[], metric: string, unit: string): StatisticalSummary => {
      const sum = values.reduce((a, b) => a + b, 0)
      const average = sum / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)

      const currentValue =
        metric === "temperature"
          ? currentData.temperature
          : metric === "humidity"
            ? currentData.humidity
            : metric === "moisture"
              ? currentData.moisture
              : metric === "gasLevel"
                ? currentData.gasLevel
                : currentData.uvRadiation

      return {
        metric,
        current: currentValue,
        average,
        min,
        max,
        stdDev,
        unit,
      }
    }

    return [
      calculateStats(
        historicalData.map((d) => d.temperature),
        "temperature",
        "°C",
      ),
      calculateStats(
        historicalData.map((d) => d.humidity),
        "humidity",
        "%",
      ),
      calculateStats(
        historicalData.map((d) => d.moisture),
        "moisture",
        "%",
      ),
      calculateStats(
        historicalData.map((d) => d.gasLevel),
        "gasLevel",
        "ppm",
      ),
      calculateStats(
        historicalData.map((d) => d.uvRadiation),
        "uvRadiation",
        "UV Index",
      ),
    ]
  }, [historicalData, currentData])

  // Calculate trend analysis
  const trendAnalysis = useMemo((): TrendAnalysis[] => {
    if (historicalData.length < 2) return []

    const calculateTrend = (values: number[], metric: string): TrendAnalysis => {
      const recent = values.slice(-6) // Last 6 hours
      const older = values.slice(-12, -6) // Previous 6 hours

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
      const change = ((recentAvg - olderAvg) / olderAvg) * 100

      // Simple linear prediction for next hour
      const slope = (recent[recent.length - 1] - recent[0]) / recent.length
      const prediction = recent[recent.length - 1] + slope

      let trend: "up" | "down" | "stable" = "stable"
      if (Math.abs(change) > 5) {
        trend = change > 0 ? "up" : "down"
      }

      // Determine status and recommendation
      let status: "good" | "warning" | "critical" = "good"
      let recommendation = ""

      switch (metric) {
        case "temperature":
          if (prediction > 35 || prediction < 10) {
            status = "critical"
            recommendation =
              prediction > 35 ? "Implement cooling measures immediately" : "Protect crops from cold damage"
          } else if (prediction > 30 || prediction < 15) {
            status = "warning"
            recommendation = prediction > 30 ? "Monitor for heat stress" : "Consider frost protection"
          } else {
            recommendation = "Temperature trending within optimal range"
          }
          break
        case "moisture":
          if (prediction < 25 || prediction > 75) {
            status = "critical"
            recommendation =
              prediction < 25 ? "Increase irrigation immediately" : "Improve drainage to prevent root rot"
          } else if (prediction < 35 || prediction > 65) {
            status = "warning"
            recommendation = prediction < 35 ? "Schedule additional watering" : "Monitor for overwatering"
          } else {
            recommendation = "Soil moisture levels are optimal"
          }
          break
        case "humidity":
          if (prediction > 85 || prediction < 30) {
            status = "critical"
            recommendation =
              prediction > 85 ? "Improve ventilation to prevent disease" : "Increase humidity for plant health"
          } else if (prediction > 75 || prediction < 40) {
            status = "warning"
            recommendation = prediction > 75 ? "Monitor for fungal issues" : "Consider misting systems"
          } else {
            recommendation = "Humidity levels are appropriate"
          }
          break
        case "gasLevel":
          if (prediction > 450) {
            status = "critical"
            recommendation = "High gas levels detected - check for contamination"
          } else if (prediction > 400) {
            status = "warning"
            recommendation = "Monitor gas levels closely"
          } else {
            recommendation = "Gas levels are normal"
          }
          break
        case "uvRadiation":
          if (prediction > 9) {
            status = "critical"
            recommendation = "Provide shade protection for sensitive crops"
          } else if (prediction > 7) {
            status = "warning"
            recommendation = "Monitor plants for UV stress"
          } else {
            recommendation = "UV levels are manageable"
          }
          break
      }

      return {
        metric,
        trend,
        change,
        prediction,
        status,
        recommendation,
      }
    }

    return [
      calculateTrend(
        historicalData.map((d) => d.temperature),
        "temperature",
      ),
      calculateTrend(
        historicalData.map((d) => d.humidity),
        "humidity",
      ),
      calculateTrend(
        historicalData.map((d) => d.moisture),
        "moisture",
      ),
      calculateTrend(
        historicalData.map((d) => d.gasLevel),
        "gasLevel",
      ),
      calculateTrend(
        historicalData.map((d) => d.uvRadiation),
        "uvRadiation",
      ),
    ]
  }, [historicalData])

  // Calculate correlation data for scatter plots
  const correlationData = useMemo(() => {
    return historicalData.map((d) => ({
      temperature: d.temperature,
      humidity: d.humidity,
      moisture: d.moisture,
      gasLevel: d.gasLevel,
      uvRadiation: d.uvRadiation,
    }))
  }, [historicalData])

  // Calculate daily patterns
  const dailyPatterns = useMemo(() => {
    const hourlyAverages = Array.from({ length: 24 }, (_, hour) => {
      const hourData = historicalData.filter((d) => {
        const dataHour = new Date(d.timestamp).getHours()
        return dataHour === hour
      })

      if (hourData.length === 0) return null

      return {
        hour: `${hour.toString().padStart(2, "0")}:00`,
        temperature: hourData.reduce((sum, d) => sum + d.temperature, 0) / hourData.length,
        humidity: hourData.reduce((sum, d) => sum + d.humidity, 0) / hourData.length,
        moisture: hourData.reduce((sum, d) => sum + d.moisture, 0) / hourData.length,
        uvRadiation: hourData.reduce((sum, d) => sum + d.uvRadiation, 0) / hourData.length,
      }
    }).filter(Boolean)

    return hourlyAverages
  }, [historicalData])

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "temperature":
        return "🌡️"
      case "humidity":
        return "💧"
      case "moisture":
        return "🌱"
      case "gasLevel":
        return "💨"
      case "uvRadiation":
        return "☀️"
      default:
        return "📊"
    }
  }

  const getStatusColor = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "critical":
        return "text-red-500"
    }
  }

  const getStatusIcon = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertCircle className="h-4 w-4" />
      case "critical":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Historical Data Analysis
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Advanced analytics, trends, and predictive insights from your sensor data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="patterns">Daily Patterns</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendAnalysis.map((trend) => (
                <Card key={trend.metric} className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMetricIcon(trend.metric)}</span>
                        <CardTitle className="text-sm capitalize">{trend.metric}</CardTitle>
                      </div>
                      <div className={`flex items-center gap-1 ${getStatusColor(trend.status)}`}>
                        {getStatusIcon(trend.status)}
                        {trend.trend === "up" && <TrendingUp className="h-4 w-4" />}
                        {trend.trend === "down" && <TrendingDown className="h-4 w-4" />}
                        {trend.trend === "stable" && <div className="w-4 h-0.5 bg-current" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">6h Change:</span>
                      <span
                        className={
                          trend.change > 0
                            ? "text-green-600"
                            : trend.change < 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }
                      >
                        {trend.change > 0 ? "+" : ""}
                        {trend.change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Predicted:</span>
                      <span className="font-medium">{trend.prediction.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{trend.recommendation}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {statisticalSummaries.map((stat) => (
                <Card key={stat.metric} className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="text-lg">{getMetricIcon(stat.metric)}</span>
                      <span className="capitalize">{stat.metric} Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Current</div>
                        <div className="text-lg font-semibold">
                          {stat.current.toFixed(1)} {stat.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Average</div>
                        <div className="text-lg font-semibold">
                          {stat.average.toFixed(1)} {stat.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Min</div>
                        <div className="font-medium">
                          {stat.min.toFixed(1)} {stat.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max</div>
                        <div className="font-medium">
                          {stat.max.toFixed(1)} {stat.unit}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm mb-2">
                        Variability (σ: {stat.stdDev.toFixed(1)})
                      </div>
                      <Progress value={Math.min((stat.stdDev / (stat.max - stat.min)) * 100, 100)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <div className="h-80">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                24-Hour Average Patterns
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyPatterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Humidity (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="uvRadiation"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    name="UV Index"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Peak Temperature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-1">
                    {dailyPatterns.length > 0
                      ? `${Math.max(...dailyPatterns.map((d) => d.temperature)).toFixed(1)}°C`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Usually around 2-4 PM</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Peak UV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-5">
                    {dailyPatterns.length > 0
                      ? `${Math.max(...dailyPatterns.map((d) => d.uvRadiation)).toFixed(1)}`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Midday solar maximum</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Night Humidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-2">
                    {dailyPatterns.length > 0
                      ? `${Math.max(...dailyPatterns.map((d) => d.humidity)).toFixed(1)}%`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Peaks during early morning</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Temperature vs Humidity</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="temperature"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      name="Temperature"
                      unit="°C"
                    />
                    <YAxis
                      dataKey="humidity"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      name="Humidity"
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Scatter dataKey="humidity" fill="hsl(var(--chart-2))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="h-80">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Moisture vs Gas Level</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="moisture"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      name="Moisture"
                      unit="%"
                    />
                    <YAxis
                      dataKey="gasLevel"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      name="Gas Level"
                      unit="ppm"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Scatter dataKey="gasLevel" fill="hsl(var(--chart-4))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Key Correlations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Temperature ↔ Humidity</span>
                    <Badge variant="secondary">Inverse</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>UV ↔ Temperature</span>
                    <Badge variant="secondary">Positive</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Moisture ↔ Gas Level</span>
                    <Badge variant="secondary">Weak</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Insights</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Higher temperatures typically correlate with lower humidity. UV radiation peaks align with temperature
                  maximums. Soil moisture shows independent variation from atmospheric conditions.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendAnalysis.map((trend) => (
                <Card key={trend.metric} className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm capitalize">{trend.metric} Forecast</CardTitle>
                      </div>
                      <Badge
                        variant={
                          trend.status === "good" ? "default" : trend.status === "warning" ? "secondary" : "destructive"
                        }
                      >
                        {trend.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{trend.prediction.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Predicted next hour</div>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <strong>Action:</strong> {trend.recommendation}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Immediate Actions</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {trendAnalysis
                        .filter((t) => t.status === "critical")
                        .map((t) => (
                          <li key={t.metric} className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                            {t.recommendation}
                          </li>
                        ))}
                      {trendAnalysis.filter((t) => t.status === "critical").length === 0 && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                          No critical issues detected
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Preventive Measures</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {trendAnalysis
                        .filter((t) => t.status === "warning")
                        .map((t) => (
                          <li key={t.metric} className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                            {t.recommendation}
                          </li>
                        ))}
                      {trendAnalysis.filter((t) => t.status === "warning").length === 0 && (
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                          All parameters within acceptable ranges
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
