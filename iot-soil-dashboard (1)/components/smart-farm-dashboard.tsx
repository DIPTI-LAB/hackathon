"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MotorControlPanel } from "./motor-control-panel"
import { CropRecommendationPanel } from "./crop-recommendation-panel"
import { FarmerAssistantChatbot } from "./farmer-assistant-chatbot"
import DocumentationHub from "./documentation-hub"
import SMSNotificationPanel from "./sms-notification-panel"
import {
  Thermometer,
  Droplets,
  Sprout,
  Wind,
  Gauge,
  CloudRain,
  Zap,
  Power,
  PowerOff,
  Leaf,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { smartFarmClient, type SensorReading, type MotorStatus } from "@/lib/supabase-client"

export function SmartFarmDashboard() {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null)
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([])
  const [motorStatus, setMotorStatus] = useState<MotorStatus | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch latest sensor data
  const fetchLatestData = async () => {
    try {
      setError(null)
      const data = await smartFarmClient.getLatestReading()
      setSensorData(data)
      setIsOnline(true)
    } catch (err) {
      console.error("Failed to fetch sensor data:", err)
      setError("Failed to connect to sensors")
      setIsOnline(false)
    }
  }

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      const data = await smartFarmClient.getHistoricalData(24)
      setHistoricalData(data)
    } catch (err) {
      console.error("Failed to fetch historical data:", err)
    }
  }

  // Fetch motor status
  const fetchMotorStatus = async () => {
    try {
      const status = await smartFarmClient.getMotorStatus()
      setMotorStatus(status)
    } catch (err) {
      console.error("Failed to fetch motor status:", err)
    }
  }

  // Toggle motor manually
  const toggleMotor = async () => {
    if (!motorStatus) return

    try {
      const newStatus = !motorStatus.status
      const updatedStatus = await smartFarmClient.updateMotorStatus(
        newStatus,
        "manual",
        `Manual ${newStatus ? "activation" : "deactivation"} by user`,
        "user",
      )
      setMotorStatus(updatedStatus)
    } catch (err) {
      console.error("Failed to toggle motor:", err)
      setError("Failed to control motor")
    }
  }

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await Promise.all([fetchLatestData(), fetchHistoricalData(), fetchMotorStatus()])
      setIsLoading(false)
    }

    loadInitialData()
  }, [])

  // Set up real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestData()
      fetchMotorStatus()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Auto motor control based on soil moisture
  useEffect(() => {
    if (sensorData && motorStatus && motorStatus.mode === "automatic") {
      const shouldActivate = sensorData.soil_moisture < 30 // Activate if soil moisture below 30%

      if (shouldActivate !== motorStatus.status) {
        smartFarmClient
          .updateMotorStatus(
            shouldActivate,
            "automatic",
            `Automatic ${shouldActivate ? "activation" : "deactivation"} - soil moisture: ${sensorData.soil_moisture.toFixed(1)}%`,
            "system",
          )
          .then(setMotorStatus)
      }
    }
  }, [sensorData, motorStatus])

  const getSensorStatus = (value: number, type: string) => {
    switch (type) {
      case "soil_temperature":
        if (value < 15) return { status: "Cold", color: "bg-blue-500", trend: "low" }
        if (value > 30) return { status: "Hot", color: "bg-red-500", trend: "high" }
        return { status: "Optimal", color: "bg-green-500", trend: "normal" }
      case "air_temperature":
        if (value < 18) return { status: "Cold", color: "bg-blue-500", trend: "low" }
        if (value > 32) return { status: "Hot", color: "bg-red-500", trend: "high" }
        return { status: "Good", color: "bg-green-500", trend: "normal" }
      case "soil_moisture":
        if (value < 30) return { status: "Dry", color: "bg-red-500", trend: "low" }
        if (value > 70) return { status: "Wet", color: "bg-blue-500", trend: "high" }
        return { status: "Good", color: "bg-green-500", trend: "normal" }
      case "soil_humidity":
      case "air_humidity":
        if (value < 40) return { status: "Low", color: "bg-orange-500", trend: "low" }
        if (value > 80) return { status: "High", color: "bg-blue-500", trend: "high" }
        return { status: "Good", color: "bg-green-500", trend: "normal" }
      case "pressure":
        if (value < 100) return { status: "Low", color: "bg-orange-500", trend: "low" }
        if (value > 103) return { status: "High", color: "bg-blue-500", trend: "high" }
        return { status: "Normal", color: "bg-green-500", trend: "normal" }
      case "ammonia":
        if (value > 25) return { status: "High", color: "bg-red-500", trend: "high" }
        if (value > 15) return { status: "Elevated", color: "bg-orange-500", trend: "high" }
        return { status: "Normal", color: "bg-green-500", trend: "normal" }
      default:
        return { status: "Unknown", color: "bg-gray-500", trend: "normal" }
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "high":
        return <TrendingUp className="h-3 w-3" />
      case "low":
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto p-6 flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Leaf className="absolute inset-0 h-8 w-8 text-primary m-auto floating" />
            </div>
            <p className="text-muted-foreground text-lg">Initializing Smart Farm System...</p>
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

  if (!sensorData) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto p-6 flex items-center justify-center min-h-screen relative z-10">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Unable to load sensor data. Please check your connection and try again.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
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
                  Smart Farm IoT System
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">Precision agriculture with automated irrigation control</p>
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

              {/* Motor Control */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMotor}
                  variant={motorStatus?.status ? "default" : "outline"}
                  className={`${
                    motorStatus?.status
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "border-red-500 text-red-500 hover:bg-red-50"
                  } transition-all duration-300`}
                >
                  {motorStatus?.status ? <Power className="h-4 w-4 mr-2" /> : <PowerOff className="h-4 w-4 mr-2" />}
                  Motor {motorStatus?.status ? "ON" : "OFF"}
                </Button>
                <Badge variant={motorStatus?.mode === "automatic" ? "default" : "secondary"}>{motorStatus?.mode}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {/* Soil Moisture */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soil Moisture</CardTitle>
              <Droplets className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.soil_moisture.toFixed(1)}%</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.soil_moisture, "soil_moisture").color}>
                  {getSensorStatus(sensorData.soil_moisture, "soil_moisture").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.soil_moisture, "soil_moisture").trend)}
              </div>
            </CardContent>
          </Card>

          {/* Soil Temperature */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soil Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.soil_temperature.toFixed(1)}°C</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.soil_temperature, "soil_temperature").color}>
                  {getSensorStatus(sensorData.soil_temperature, "soil_temperature").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.soil_temperature, "soil_temperature").trend)}
              </div>
            </CardContent>
          </Card>

          {/* Air Temperature */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Air Temperature</CardTitle>
              <Wind className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.air_temperature.toFixed(1)}°C</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.air_temperature, "air_temperature").color}>
                  {getSensorStatus(sensorData.air_temperature, "air_temperature").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.air_temperature, "air_temperature").trend)}
              </div>
            </CardContent>
          </Card>

          {/* Air Humidity */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Air Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.air_humidity.toFixed(1)}%</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.air_humidity, "air_humidity").color}>
                  {getSensorStatus(sensorData.air_humidity, "air_humidity").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.air_humidity, "air_humidity").trend)}
              </div>
            </CardContent>
          </Card>

          {/* Pressure */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pressure</CardTitle>
              <Gauge className="h-4 w-4 text-chart-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.pressure.toFixed(1)} kPa</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.pressure, "pressure").color}>
                  {getSensorStatus(sensorData.pressure, "pressure").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.pressure, "pressure").trend)}
              </div>
            </CardContent>
          </Card>

          {/* Rainfall */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rainfall</CardTitle>
              <CloudRain className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.rainfall.toFixed(1)} mm</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {sensorData.rainfall > 5 ? "Heavy" : sensorData.rainfall > 1 ? "Light" : "None"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ammonia */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ammonia</CardTitle>
              <Zap className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.ammonia.toFixed(1)} ppm</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.ammonia, "ammonia").color}>
                  {getSensorStatus(sensorData.ammonia, "ammonia").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.ammonia, "ammonia").trend)}
              </div>
            </CardContent>
          </Card>

          {/* Soil Humidity */}
          <Card className="glass card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soil Humidity</CardTitle>
              <Sprout className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.soil_humidity.toFixed(1)}%</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getSensorStatus(sensorData.soil_humidity, "soil_humidity").color}>
                  {getSensorStatus(sensorData.soil_humidity, "soil_humidity").status}
                </Badge>
                {getTrendIcon(getSensorStatus(sensorData.soil_humidity, "soil_humidity").trend)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Smart Farm Control Center</CardTitle>
            <CardDescription>Comprehensive farm management and monitoring tools</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="control" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="control">Control & Monitor</TabsTrigger>
                <TabsTrigger value="recommendations">Crop Insights</TabsTrigger>
                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
                <TabsTrigger value="sms">SMS Alerts</TabsTrigger>
                <TabsTrigger value="documentation">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Documentation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="control" className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <MotorControlPanel sensorData={sensorData} />
                  <div className="space-y-6">
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-primary" />
                          System Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Database Connection:</span>
                            <div className="w-3 h-3 bg-green-500 rounded-full status-indicator" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Sensor Network:</span>
                            <div
                              className={`w-3 h-3 rounded-full status-indicator ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Motor Status:</span>
                            <Badge className={motorStatus?.status ? "bg-green-500" : "bg-red-500"}>
                              {motorStatus?.status ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Last Update:</span>
                            <span className="text-sm text-muted-foreground">
                              {sensorData.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <CropRecommendationPanel />
              </TabsContent>

              <TabsContent value="assistant" className="space-y-6">
                <FarmerAssistantChatbot sensorData={sensorData} />
              </TabsContent>

              <TabsContent value="sms" className="space-y-6">
                <SMSNotificationPanel />
              </TabsContent>

              <TabsContent value="documentation" className="space-y-6">
                <DocumentationHub />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Sensor Data Visualization</CardTitle>
            <CardDescription>24-hour trends and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="environmental">Environmental</TabsTrigger>
                <TabsTrigger value="soil">Soil Health</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        }
                      />
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
                        dataKey="soil_moisture"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        name="Soil Moisture (%)"
                      />
                      <Line
                        type="monotone"
                        dataKey="air_temperature"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        name="Air Temperature (°C)"
                      />
                      <Line
                        type="monotone"
                        dataKey="air_humidity"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        name="Air Humidity (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="environmental" className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        }
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="air_temperature"
                        stackId="1"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                        name="Air Temperature (°C)"
                      />
                      <Area
                        type="monotone"
                        dataKey="pressure"
                        stackId="2"
                        stroke="hsl(var(--chart-5))"
                        fill="hsl(var(--chart-5))"
                        fillOpacity={0.6}
                        name="Pressure (kPa)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="soil" className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        }
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="soil_moisture"
                        stroke="hsl(var(--chart-2))"
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.6}
                        name="Soil Moisture (%)"
                      />
                      <Line
                        type="monotone"
                        dataKey="soil_temperature"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        name="Soil Temperature (°C)"
                      />
                      <Line
                        type="monotone"
                        dataKey="ammonia"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        name="Ammonia (ppm)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Motor Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Status:</span>
                          <Badge className={motorStatus?.status ? "bg-green-500" : "bg-red-500"}>
                            {motorStatus?.status ? "RUNNING" : "STOPPED"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Mode:</span>
                          <Badge variant={motorStatus?.mode === "automatic" ? "default" : "secondary"}>
                            {motorStatus?.mode?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{motorStatus?.reason}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        System Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Database:</span>
                          <div className="w-3 h-3 bg-green-500 rounded-full status-indicator" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Sensors:</span>
                          <div
                            className={`w-3 h-3 rounded-full status-indicator ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Last Update:</span>
                          <span className="text-sm text-muted-foreground">
                            {sensorData.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
