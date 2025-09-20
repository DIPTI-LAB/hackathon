"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Power, PowerOff, Settings, Droplets, AlertTriangle, CheckCircle, Activity, Zap, Timer } from "lucide-react"

interface MotorStatus {
  id?: string
  status: boolean
  mode: "automatic" | "manual"
  reason?: string
  changed_by: "system" | "user"
  created_at: Date
  error?: boolean
}

interface MotorControlPanelProps {
  sensorData?: {
    soil_moisture: number
    air_temperature: number
    air_humidity: number
    rainfall: number
  }
}

export function MotorControlPanel({ sensorData }: MotorControlPanelProps) {
  const [motorStatus, setMotorStatus] = useState<MotorStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch motor status
  const fetchMotorStatus = async () => {
    try {
      const response = await fetch("/api/motor")
      const data = await response.json()
      setMotorStatus(data)
      setError(data.error ? "Database connection error" : null)
    } catch (err) {
      console.error("Failed to fetch motor status:", err)
      setError("Failed to connect to motor control system")
    }
  }

  // Toggle motor manually
  const toggleMotor = async () => {
    if (!motorStatus || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/motor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: !motorStatus.status,
          mode: "manual",
          reason: `Manual ${!motorStatus.status ? "activation" : "deactivation"} by user`,
          changed_by: "user",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update motor status")
      }

      const data = await response.json()
      setMotorStatus(data)
      setError(null)
    } catch (err) {
      console.error("Failed to toggle motor:", err)
      setError("Failed to control motor")
    } finally {
      setIsUpdating(false)
    }
  }

  // Switch to automatic mode
  const switchToAutomatic = async () => {
    if (!motorStatus || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/motor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: motorStatus.status,
          mode: "automatic",
          reason: "Switched to automatic mode",
          changed_by: "user",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to switch mode")
      }

      const data = await response.json()
      setMotorStatus(data)
      setError(null)

      // Trigger auto-control check
      await fetch("/api/motor/auto-control", { method: "POST" })
      // Refresh status after auto-control
      setTimeout(fetchMotorStatus, 1000)
    } catch (err) {
      console.error("Failed to switch mode:", err)
      setError("Failed to switch to automatic mode")
    } finally {
      setIsUpdating(false)
    }
  }

  // Run auto-control check
  const runAutoControl = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/motor/auto-control", { method: "POST" })
      const data = await response.json()

      if (data.action !== "none") {
        // Refresh motor status if action was taken
        setTimeout(fetchMotorStatus, 500)
      }
    } catch (err) {
      console.error("Auto-control failed:", err)
      setError("Auto-control check failed")
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchMotorStatus()
      setIsLoading(false)
    }

    loadData()
  }, [])

  // Auto-refresh motor status
  useEffect(() => {
    const interval = setInterval(fetchMotorStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-control check for automatic mode
  useEffect(() => {
    if (motorStatus?.mode === "automatic") {
      const interval = setInterval(runAutoControl, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [motorStatus?.mode])

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Motor Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          Irrigation Motor Control
        </CardTitle>
        <CardDescription>Automated and manual water pump control system</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="control">Control</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Motor Status Display */}
            <div className="flex items-center justify-between p-4 glass rounded-xl">
              <div className="flex items-center gap-3">
                {motorStatus?.status ? (
                  <Power className="h-6 w-6 text-green-500 status-indicator" />
                ) : (
                  <PowerOff className="h-6 w-6 text-red-500" />
                )}
                <div>
                  <p className="font-semibold">Motor {motorStatus?.status ? "RUNNING" : "STOPPED"}</p>
                  <p className="text-sm text-muted-foreground">{motorStatus?.mode?.toUpperCase()} MODE</p>
                </div>
              </div>
              <Badge
                className={motorStatus?.status ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
              >
                {motorStatus?.status ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={toggleMotor}
                disabled={isUpdating || !motorStatus}
                variant={motorStatus?.status ? "destructive" : "default"}
                className="h-12"
              >
                {isUpdating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                ) : motorStatus?.status ? (
                  <PowerOff className="h-4 w-4 mr-2" />
                ) : (
                  <Power className="h-4 w-4 mr-2" />
                )}
                {motorStatus?.status ? "Stop Motor" : "Start Motor"}
              </Button>

              <Button
                onClick={switchToAutomatic}
                disabled={isUpdating || !motorStatus || motorStatus.mode === "automatic"}
                variant="outline"
                className="h-12 bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Auto Mode
              </Button>
            </div>

            {/* Mode Switch */}
            <div className="flex items-center justify-between p-4 glass rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Automatic Control</p>
                  <p className="text-sm text-muted-foreground">Based on soil moisture and weather</p>
                </div>
              </div>
              <Switch
                checked={motorStatus?.mode === "automatic"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    switchToAutomatic()
                  }
                }}
                disabled={isUpdating}
              />
            </div>

            {/* Sensor-based Recommendations */}
            {sensorData && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Current Conditions
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span>Soil Moisture:</span>
                    <span className={sensorData.soil_moisture < 30 ? "text-red-500" : "text-green-500"}>
                      {sensorData.soil_moisture.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span>{sensorData.air_temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity:</span>
                    <span>{sensorData.air_humidity.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rainfall:</span>
                    <span className={sensorData.rainfall > 1 ? "text-blue-500" : "text-gray-500"}>
                      {sensorData.rainfall.toFixed(1)}mm
                    </span>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Recommendation:</strong>{" "}
                    {sensorData.rainfall > 1
                      ? "No irrigation needed due to recent rainfall"
                      : sensorData.soil_moisture < 30
                        ? "Irrigation recommended - soil moisture is low"
                        : sensorData.soil_moisture > 60
                          ? "No irrigation needed - soil moisture is adequate"
                          : "Monitor conditions - soil moisture is moderate"}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>Status:</strong> {motorStatus?.status ? "Running" : "Stopped"}
                  </p>
                  <p>
                    <strong>Mode:</strong> {motorStatus?.mode}
                  </p>
                  <p>
                    <strong>Changed by:</strong> {motorStatus?.changed_by}
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Last updated:</strong>
                  </p>
                  <p className="text-muted-foreground">
                    {motorStatus?.created_at ? new Date(motorStatus.created_at).toLocaleString() : "Unknown"}
                  </p>
                </div>
              </div>

              {motorStatus?.reason && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Reason:</strong> {motorStatus.reason}
                  </p>
                </div>
              )}

              <Button
                onClick={fetchMotorStatus}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isUpdating}
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="text-center p-8 text-muted-foreground">
              <Timer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Irrigation scheduling feature</p>
              <p className="text-sm">Coming in next update</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
