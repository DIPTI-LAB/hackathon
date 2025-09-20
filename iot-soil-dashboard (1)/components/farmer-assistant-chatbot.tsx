"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, User, Leaf, Lightbulb, AlertTriangle, Sparkles, RefreshCw, Mic, MicOff } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  fallback?: boolean
}

interface SensorData {
  soil_moisture: number
  soil_temperature: number
  air_temperature: number
  air_humidity: number
  pressure: number
  rainfall: number
  ammonia: number
  timestamp: Date
}

interface FarmerAssistantChatbotProps {
  sensorData?: SensorData
}

export function FarmerAssistantChatbot({ sensorData }: FarmerAssistantChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Quick suggestion buttons
  const quickSuggestions = [
    "What crops should I plant now?",
    "How's my soil moisture?",
    "Any irrigation recommendations?",
    "Check for pest risks",
    "Fertilizer advice",
    "Weather impact analysis",
  ]

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your AI farming assistant. I can help you with crop recommendations, irrigation advice, pest management, and more based on your current sensor data. 

Current conditions:
${
  sensorData
    ? `
• Soil Moisture: ${sensorData.soil_moisture.toFixed(1)}%
• Air Temperature: ${sensorData.air_temperature.toFixed(1)}°C
• Soil Temperature: ${sensorData.soil_temperature.toFixed(1)}°C
• Humidity: ${sensorData.air_humidity.toFixed(1)}%

What would you like to know about your farm today?`
    : "Sensor data not available. I can still provide general farming advice!"
}`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }, [sensorData])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      // Prepare sensor data for API
      const sensorContext = sensorData
        ? {
            temperature: sensorData.air_temperature,
            humidity: sensorData.air_humidity,
            moisture: sensorData.soil_moisture,
            gasLevel: sensorData.ammonia,
            uvRadiation: 5, // Mock UV data
            timestamp: sensorData.timestamp.toISOString(),
          }
        : undefined

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent.trim(),
          sensorData: sensorContext,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from assistant")
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        fallback: data.fallback,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error("Chat error:", err)
      setError("Failed to get response from assistant. Please try again.")

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or check your internet connection.",
        timestamp: new Date(),
        fallback: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    // Re-add welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome-new",
      role: "assistant",
      content: "Chat cleared! How can I help you with your farming today?",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  // Mock voice recognition (would need actual implementation)
  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // In a real implementation, this would start/stop speech recognition
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        // Mock voice input
        setInputMessage("What's the best time to water my crops?")
      }, 2000)
    }
  }

  return (
    <Card className="glass h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-6 w-6 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">Farm Assistant AI</CardTitle>
              <CardDescription>Your intelligent farming companion</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sensorData && (
              <Badge variant="outline" className="text-xs">
                <Leaf className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
            )}
            <Button onClick={clearChat} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {message.fallback && (
                      <Badge variant="secondary" className="text-xs">
                        <AlertTriangle className="h-2 w-2 mr-1" />
                        Offline Mode
                      </Badge>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-secondary" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Quick Suggestions */}
        <div className="px-6 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Quick Questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                onClick={() => handleQuickSuggestion(suggestion)}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Input Area */}
        <div className="px-6 py-4">
          {error && (
            <Alert className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about farming..."
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                type="button"
                onClick={toggleVoiceInput}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Powered by AI • Real-time sensor integration</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Smart Farming Assistant</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
