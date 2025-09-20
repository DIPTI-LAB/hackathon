"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Thermometer,
  Droplets,
  Sprout,
  Wind,
  Sun,
  MessageCircle,
  Leaf,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { thingSpeakClient, type SensorReading, type HistoricalData } from "@/lib/thingspeak"
import { AIChatAssistant } from "./ai-chat-assistant"
import { HistoricalAnalysis } from "./historical-analysis"
import { AnimatedBackground } from "./animated-background"
import { EnhancedSensorCard } from "./enhanced-sensor-card"
import { InteractiveChartContainer } from "./interactive-chart-container"

export function SensorDashboard() {
  const [sensorData, setSensorData] = useState<SensorReading>({
    temperature: 24.5,
    humidity: 65,
    moisture: 42,
    gasLevel: 350,
    uvRadiation: 6.2,
    timestamp: new Date(),
  })

  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Fetch latest sensor data from ThingsSpeak
  const fetchLatestData = async () => {
    try {
      setError(null)
      const data = await thingSpeakClient.getLatestReading()
      setSensorData(data)
      setUsingFallback(!!data.fallback)
      setIsOnline(true)
    } catch (err) {
      console.error("Failed to fetch sensor data:", err)
      setIsOnline(false)
      setUsingFallback(true)

      // Use fallback data instead of showing error
      setSensorData({
        temperature: 24.5 + (Math.random() - 0.5) * 4,
        humidity: 65 + (Math.random() - 0.5) * 20,
        moisture: 42 + (Math.random() - 0.5) * 15,
        gasLevel: 350 + (Math.random() - 0.5) * 50,
        uvRadiation: 6.2 + (Math.random() - 0.5) * 2,
        timestamp: new Date(),
        fallback: true,
      })
    }
  }

  // Fetch historical data from ThingsSpeak
  const fetchHistoricalData = async () => {
    try {
      const data = await thingSpeakClient.getHistoricalData(24)
      setHistoricalData(data)
    } catch (err) {
      console.error("Failed to fetch historical data:", err)
      const mockFeeds = Array.from({ length: 24 }, (_, i) => {
        const time = new Date(Date.now() - i * 60 * 60 * 1000)
        return {
          temperature: 24.5 + (Math.random() - 0.5) * 8,
          humidity: 65 + (Math.random() - 0.5) * 30,
          moisture: 42 + (Math.random() - 0.5) * 20,
          gasLevel: 350 + (Math.random() - 0.5) * 100,
          uvRadiation: 6.2 + (Math.random() - 0.5) * 4,
          timestamp: time,
          time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
      }).reverse()

      setHistoricalData(mockFeeds)
    }
  }

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await Promise.all([fetchLatestData(), fetchHistoricalData()])
      setIsLoading(false)
    }

    loadInitialData()
  }, [])

  // Set up real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestData()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Update historical data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistoricalData()
    }, 300000) // Update every 5 minutes

    return () => clearInterval(interval)
  }, [])

  const getSensorStatus = (value: number, type: string) => {
    switch (type) {
      case "temperature":
        if (value < 15) return { status: "Low", color: "bg-blue-500" }
        if (value > 30) return { status: "High", color: "bg-red-500" }
        return { status: "Optimal", color: "bg-green-500" }
      case "humidity":
        if (value < 40) return { status: "Low", color: "bg-orange-500" }
        if (value > 80) return { status: "High", color: "bg-blue-500" }
        return { status: "Good", color: "bg-green-500" }
      case "moisture":
        if (value < 30) return { status: "Dry", color: "bg-red-500" }
        if (value > 70) return { status: "Wet", color: "bg-blue-500" }
        return { status: "Good", color: "bg-green-500" }
      case "gas":
        if (value > 400) return { status: "High", color: "bg-red-500" }
        return { status: "Normal", color: "bg-green-500" }
      case "uv":
        if (value > 8) return { status: "Very High", color: "bg-red-500" }
        if (value > 6) return { status: "High", color: "bg-orange-500" }
        return { status: "Moderate", color: "bg-green-500" }
      default:
        return { status: "Unknown", color: "bg-gray-500" }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <div className="absolute inset-0 h-16 w-16 text-primary/30 animate-ping">
                <div className="absolute inset-0 h-16 w-16 text-primary/30 animate-ping">
                  <Leaf className="h-10 w-10" />
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-lg">Loading sensor data...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <div className="relative">
                  <Leaf className="h-10 w-10 text-primary floating" />
                  <div className="absolute inset-0 h-10 w-10 text-primary/30 animate-ping">
                    <Leaf className="h-10 w-10" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Soil Quality Monitor
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">Real-time IoT sensor data for optimal crop management</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500 status-indicator" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500 status-indicator" />
                )}
                <span className="text-sm font-medium">{isOnline ? "Connected" : "Offline"}</span>
              </div>
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask AI Assistant
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Status Alerts */}
        {usingFallback && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Using demo data - Configure ThingsSpeak API keys in Project Settings → Environment Variables for live
              sensor data
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <EnhancedSensorCard
            title="Temperature"
            value={sensorData.temperature}
            unit="°C"
            icon={<Thermometer className="h-5 w-5 text-chart-1" />}
            status={getSensorStatus(sensorData.temperature, "temperature")}
            timestamp={sensorData.timestamp}
            trend="up"
            trendValue={2.3}
            optimal={{ min: 15, max: 30 }}
            chartColor="#3b82f6"
          />

          <EnhancedSensorCard
            title="Humidity"
            value={sensorData.humidity}
            unit="%"
            icon={<Droplets className="h-5 w-5 text-chart-2" />}
            status={getSensorStatus(sensorData.humidity, "humidity")}
            timestamp={sensorData.timestamp}
            trend="stable"
            trendValue={0.1}
            optimal={{ min: 40, max: 80 }}
            chartColor="#10b981"
          />

          <EnhancedSensorCard
            title="Soil Moisture"
            value={sensorData.moisture}
            unit="%"
            icon={<Sprout className="h-5 w-5 text-chart-3" />}
            status={getSensorStatus(sensorData.moisture, "moisture")}
            timestamp={sensorData.timestamp}
            trend="down"
            trendValue={-1.2}
            optimal={{ min: 30, max: 70 }}
            chartColor="#fbbf24"
          />

          <EnhancedSensorCard
            title="Gas Level"
            value={sensorData.gasLevel}
            unit="ppm"
            icon={<Wind className="h-5 w-5 text-chart-4" />}
            status={getSensorStatus(sensorData.gasLevel, "gas")}
            timestamp={sensorData.timestamp}
            trend="stable"
            trendValue={0.5}
            optimal={{ min: 200, max: 400 }}
            chartColor="#ef4444"
          />

          <EnhancedSensorCard
            title="UV Radiation"
            value={sensorData.uvRadiation}
            unit="UV Index"
            icon={<Sun className="h-5 w-5 text-chart-5" />}
            status={getSensorStatus(sensorData.uvRadiation, "uv")}
            timestamp={sensorData.timestamp}
            trend="up"
            trendValue={1.8}
            optimal={{ min: 3, max: 8 }}
            chartColor="#a855f7"
          />
        </div>

        <InteractiveChartContainer
          title="Real-time Data Visualization"
          description="24-hour sensor data trends and patterns"
          onRefresh={() => {
            fetchLatestData()
            fetchHistoricalData()
          }}
          onExport={() => {
            // Export functionality
            console.log("Exporting data...")
          }}
          onFullscreen={() => {
            // Fullscreen functionality
            console.log("Opening fullscreen...")
          }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="environmental">Environmental</TabsTrigger>
              <TabsTrigger value="soil">Soil Health</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Multi-line chart showing all sensors */}
              <div className="h-80">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">All Sensors Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                      dataKey="moisture"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      name="Soil Moisture (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="environmental" className="space-y-6">
              {/* Temperature and Humidity Area Chart */}
              <div className="h-80">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Temperature & Humidity</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                      name="Temperature (°C)"
                    />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stackId="2"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                      name="Humidity (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* UV Radiation Line Chart */}
              <div className="h-64">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">UV Radiation Index</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="uvRadiation"
                      stroke="hsl(var(--chart-5))"
                      strokeWidth={3}
                      name="UV Index"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="soil" className="space-y-6">
              {/* Soil Moisture and Gas Level */}
              <div className="h-80">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Soil Health Indicators</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="moisture"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                      name="Soil Moisture (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="gasLevel"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      name="Gas Level (ppm)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              {/* Current Status Bar Chart */}
              <div className="h-80">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Current Sensor Status</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Temperature", value: sensorData.temperature, optimal: 25, unit: "°C" },
                      { name: "Humidity", value: sensorData.humidity, optimal: 60, unit: "%" },
                      { name: "Moisture", value: sensorData.moisture, optimal: 50, unit: "%" },
                      { name: "Gas Level", value: sensorData.gasLevel, optimal: 300, unit: "ppm" },
                      { name: "UV Index", value: sensorData.uvRadiation, optimal: 5, unit: "UV" },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Current Value" />
                    <Bar dataKey="optimal" fill="hsl(var(--muted))" name="Optimal Range" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </InteractiveChartContainer>

        <HistoricalAnalysis historicalData={historicalData} currentData={sensorData} />

        <Card className="glass card-hover">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monitor your IoT sensors and ThingsSpeak integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 glass rounded-xl card-hover">
                <div>
                  <p className="text-sm font-medium text-foreground">ThingsSpeak</p>
                  <p className="text-xs text-muted-foreground">{usingFallback ? "Demo mode" : "Data sync active"}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full status-indicator ${
                    usingFallback ? "bg-yellow-500" : "bg-green-500"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between p-4 glass rounded-xl card-hover">
                <div>
                  <p className="text-sm font-medium text-foreground">Sensors</p>
                  <p className="text-xs text-muted-foreground">{isOnline ? "5/5 online" : "Connection lost"}</p>
                </div>
                <div className={`w-4 h-4 rounded-full status-indicator ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
              </div>

              <div className="flex items-center justify-between p-4 glass rounded-xl card-hover">
                <div>
                  <p className="text-sm font-medium text-foreground">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Ready for queries</p>
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-full status-indicator" />
              </div>
            </div>
          </CardContent>
        </Card>

        <AIChatAssistant sensorData={sensorData} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </div>
  )
}
