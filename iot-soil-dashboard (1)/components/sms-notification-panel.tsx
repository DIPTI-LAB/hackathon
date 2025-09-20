"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Phone, Send, Settings, Bell, CheckCircle, AlertTriangle, Clock, Smartphone } from "lucide-react"

interface SMSSettings {
  phoneNumber: string
  alertTypes: string[]
  autoAlerts: boolean
  alertFrequency: number // minutes
}

interface SMSHistory {
  id: string
  to: string
  message: string
  status: string
  type: string
  timestamp: Date
}

const SMSNotificationPanel = () => {
  const [settings, setSettings] = useState<SMSSettings>({
    phoneNumber: "",
    alertTypes: ["soil_moisture", "temperature"],
    autoAlerts: true,
    alertFrequency: 60,
  })

  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastAlert, setLastAlert] = useState<Date | null>(null)
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([])
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("sms-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    const savedHistory = localStorage.getItem("sms-history")
    if (savedHistory) {
      setSmsHistory(
        JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      )
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = (newSettings: SMSSettings) => {
    setSettings(newSettings)
    localStorage.setItem("sms-settings", JSON.stringify(newSettings))
  }

  // Add to SMS history
  const addToHistory = (sms: Omit<SMSHistory, "id" | "timestamp">) => {
    const newSMS: SMSHistory = {
      ...sms,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
    }

    const updatedHistory = [newSMS, ...smsHistory].slice(0, 50) // Keep last 50 messages
    setSmsHistory(updatedHistory)
    localStorage.setItem("sms-history", JSON.stringify(updatedHistory))
  }

  // Send custom SMS
  const sendCustomSMS = async () => {
    if (!settings.phoneNumber || !customMessage.trim()) {
      setStatus({ type: "error", message: "Please enter phone number and message" })
      return
    }

    setIsLoading(true)
    setStatus(null)

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: settings.phoneNumber,
          message: customMessage.trim(),
          type: "manual",
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus({ type: "success", message: "SMS sent successfully!" })
        setCustomMessage("")
        addToHistory({
          to: settings.phoneNumber,
          message: customMessage.trim(),
          status: "sent",
          type: "manual",
        })
      } else {
        setStatus({ type: "error", message: result.error || "Failed to send SMS" })
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  // Check and send alerts
  const checkAlerts = async () => {
    if (!settings.phoneNumber || !settings.autoAlerts) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/sms/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: settings.phoneNumber,
          alertTypes: settings.alertTypes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.alertsSent > 0) {
          setStatus({
            type: "info",
            message: `${result.alertsSent} alert(s) sent based on current conditions`,
          })
          setLastAlert(new Date())

          // Add alerts to history
          result.alerts.forEach((alert: any) => {
            addToHistory({
              to: settings.phoneNumber,
              message: alert.message,
              status: "sent",
              type: "alert",
            })
          })
        } else {
          setStatus({ type: "success", message: "All conditions normal - no alerts needed" })
        }
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to check alerts" })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-check alerts
  useEffect(() => {
    if (!settings.autoAlerts || !settings.phoneNumber) return

    const interval = setInterval(() => {
      const now = new Date()
      if (!lastAlert || now.getTime() - lastAlert.getTime() >= settings.alertFrequency * 60 * 1000) {
        checkAlerts()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [settings, lastAlert])

  const alertTypeOptions = [
    { id: "soil_moisture", label: "Soil Moisture", description: "Low moisture alerts" },
    { id: "temperature", label: "Temperature", description: "Extreme temperature alerts" },
    { id: "ammonia", label: "Ammonia", description: "High ammonia level alerts" },
    { id: "pressure", label: "Pressure", description: "Weather pressure alerts" },
  ]

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            SMS Notifications
          </CardTitle>
          <CardDescription>Stay informed about your farm conditions via SMS alerts and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="send">Send SMS</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={settings.phoneNumber}
                    onChange={(e) => saveSettings({ ...settings, phoneNumber: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Include country code (e.g., +1 for US, +44 for UK)</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Alerts</Label>
                    <p className="text-sm text-muted-foreground">Automatically send alerts for critical conditions</p>
                  </div>
                  <Switch
                    checked={settings.autoAlerts}
                    onCheckedChange={(checked) => saveSettings({ ...settings, autoAlerts: checked })}
                  />
                </div>

                {settings.autoAlerts && (
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Alert Frequency (minutes)</Label>
                    <Input
                      id="frequency"
                      type="number"
                      min="15"
                      max="1440"
                      value={settings.alertFrequency}
                      onChange={(e) =>
                        saveSettings({ ...settings, alertFrequency: Number.parseInt(e.target.value) || 60 })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum time between automatic alerts (15 min - 24 hours)
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Alert Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {alertTypeOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Switch
                          checked={settings.alertTypes.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const newAlertTypes = checked
                              ? [...settings.alertTypes, option.id]
                              : settings.alertTypes.filter((type) => type !== option.id)
                            saveSettings({ ...settings, alertTypes: newAlertTypes })
                          }}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={checkAlerts} disabled={isLoading || !settings.phoneNumber}>
                    <Bell className="h-4 w-4 mr-2" />
                    Check Alerts Now
                  </Button>
                  {lastAlert && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last: {lastAlert.toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="send" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    maxLength={160}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>SMS messages are limited to 160 characters</span>
                    <span>{customMessage.length}/160</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Messages</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      "Irrigation system activated manually",
                      "Daily farm status check - all systems normal",
                      "Weather alert: Storm approaching, secure equipment",
                      "Harvest reminder: Crops ready for collection",
                    ].map((msg, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomMessage(msg)}
                        className="text-left justify-start h-auto p-2"
                      >
                        <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="text-xs">{msg}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={sendCustomSMS}
                  disabled={isLoading || !settings.phoneNumber || !customMessage.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? "Sending..." : "Send SMS"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">SMS History</h3>
                  <Badge variant="outline">{smsHistory.length} messages</Badge>
                </div>

                {smsHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No SMS messages sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {smsHistory.map((sms) => (
                      <Card key={sms.id} className="glass">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={sms.type === "alert" ? "destructive" : "default"}>{sms.type}</Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {sms.status}
                                </Badge>
                              </div>
                              <p className="text-sm">{sms.message}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {sms.to}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {sms.timestamp.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {status && (
        <Alert
          className={
            status.type === "error"
              ? "border-red-500"
              : status.type === "success"
                ? "border-green-500"
                : "border-blue-500"
          }
        >
          {status.type === "error" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {/* Setup Instructions */}
      <Card className="glass border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>To enable SMS notifications:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>
              Sign up for a Twilio account at <code>twilio.com</code>
            </li>
            <li>Get your Account SID, Auth Token, and phone number</li>
            <li>Add these environment variables to your Vercel project:</li>
          </ol>
          <div className="bg-muted/50 p-3 rounded-lg font-mono text-xs space-y-1">
            <div>TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
            <div>TWILIO_AUTH_TOKEN=your_auth_token_here</div>
            <div>TWILIO_PHONE_NUMBER=+1234567890</div>
          </div>
          <p className="text-xs">
            <strong>Note:</strong> Currently using dummy credentials. SMS sending is simulated until you add real Twilio
            credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SMSNotificationPanel
