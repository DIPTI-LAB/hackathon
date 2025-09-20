"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sprout,
  Leaf,
  RefreshCw,
  Droplets,
  Thermometer,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"

interface CropRecommendation {
  crop_type: string
  suitability_score: number
  recommendation_text: string
  planting_season: string
  expected_yield: string
  care_instructions: string[]
  growth_duration: string
  water_requirements: string
  temperature_range: string
}

interface CropRecommendationData {
  recommendations: CropRecommendation[]
  sensor_data: {
    soil_moisture: number
    soil_temperature: number
    air_temperature: number
    air_humidity: number
    pressure: number
    rainfall: number
    ammonia: number
    timestamp: string
  }
  analysis_date: string
}

export function CropRecommendationPanel() {
  const [recommendations, setRecommendations] = useState<CropRecommendationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null)

  const fetchRecommendations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/crop-recommendations")
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations")
      }
      const data = await response.json()
      setRecommendations(data)
      setSelectedCrop(data.recommendations[0] || null)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch crop recommendations:", err)
      setError("Failed to load crop recommendations")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSuitabilityBadge = (score: number) => {
    if (score >= 80) return { text: "Excellent", className: "bg-green-500" }
    if (score >= 60) return { text: "Good", className: "bg-yellow-500" }
    if (score >= 40) return { text: "Fair", className: "bg-orange-500" }
    return { text: "Poor", className: "bg-red-500" }
  }

  const getWaterRequirementColor = (requirement: string) => {
    switch (requirement.toLowerCase()) {
      case "high":
        return "text-blue-600"
      case "moderate":
        return "text-green-600"
      case "low":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary animate-pulse" />
            Crop Recommendations
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

  if (error || !recommendations) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            Crop Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || "No recommendations available"}</AlertDescription>
          </Alert>
          <Button onClick={fetchRecommendations} className="mt-4 bg-transparent" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Crop Recommendations
            </CardTitle>
            <CardDescription>AI-powered crop suggestions based on current conditions</CardDescription>
          </div>
          <Button onClick={fetchRecommendations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4">
              {recommendations.recommendations.slice(0, 5).map((crop, index) => {
                const badge = getSuitabilityBadge(crop.suitability_score)
                return (
                  <div
                    key={crop.crop_type}
                    className={`p-4 glass rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedCrop?.crop_type === crop.crop_type
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🌱"}
                          </span>
                          <div>
                            <h3 className="font-semibold">{crop.crop_type}</h3>
                            <p className="text-sm text-muted-foreground">{crop.planting_season}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getSuitabilityColor(crop.suitability_score)}`}>
                            {crop.suitability_score}%
                          </div>
                          <Badge className={badge.className}>{badge.text}</Badge>
                        </div>
                        <Progress value={crop.suitability_score} className="w-20" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedCrop && (
              <div className="mt-6 p-4 glass rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  {selectedCrop.crop_type} Recommendation
                </h4>
                <p className="text-sm text-muted-foreground">{selectedCrop.recommendation_text}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedCrop ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">{selectedCrop.crop_type}</h3>
                  <Badge className={getSuitabilityBadge(selectedCrop.suitability_score).className}>
                    {selectedCrop.suitability_score}% Suitable
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Growing Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Planting Season:</span>
                        <span className="text-sm font-medium">{selectedCrop.planting_season}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Growth Duration:</span>
                        <span className="text-sm font-medium">{selectedCrop.growth_duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expected Yield:</span>
                        <span className="text-sm font-medium">{selectedCrop.expected_yield}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Water Needs:</span>
                        <span
                          className={`text-sm font-medium ${getWaterRequirementColor(selectedCrop.water_requirements)}`}
                        >
                          {selectedCrop.water_requirements}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Temperature:</span>
                        <span className="text-sm font-medium">{selectedCrop.temperature_range}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Care Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedCrop.care_instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Recommendation Analysis</h4>
                  <p className="text-sm text-muted-foreground">{selectedCrop.recommendation_text}</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a crop from the overview to see detailed information</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Soil Temperature:</span>
                    <span className="text-sm font-medium">
                      {recommendations.sensor_data.soil_temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Air Temperature:</span>
                    <span className="text-sm font-medium">
                      {recommendations.sensor_data.air_temperature.toFixed(1)}°C
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Moisture Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Soil Moisture:</span>
                    <span className="text-sm font-medium">{recommendations.sensor_data.soil_moisture.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Air Humidity:</span>
                    <span className="text-sm font-medium">{recommendations.sensor_data.air_humidity.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Recent Rainfall:</span>
                    <span className="text-sm font-medium">{recommendations.sensor_data.rainfall.toFixed(1)}mm</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>Best Suited Crops:</strong>{" "}
                    {recommendations.recommendations
                      .filter((crop) => crop.suitability_score >= 70)
                      .map((crop) => crop.crop_type)
                      .join(", ") || "None with current conditions"}
                  </p>
                  <p>
                    <strong>Challenging Conditions For:</strong>{" "}
                    {recommendations.recommendations
                      .filter((crop) => crop.suitability_score < 50)
                      .map((crop) => crop.crop_type)
                      .join(", ") || "All crops have fair to good conditions"}
                  </p>
                  <p className="text-muted-foreground">
                    Analysis based on sensor data from{" "}
                    {new Date(recommendations.sensor_data.timestamp).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
