"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, Download, Search, Clock, Users, Star } from "lucide-react"

interface DocumentationItem {
  id: string
  title: string
  description: string
  type: "guide" | "video" | "manual"
  category: string
  duration?: string
  difficulty: "beginner" | "intermediate" | "advanced"
  rating: number
  views: number
  thumbnail?: string
}

const documentationData: DocumentationItem[] = [
  {
    id: "1",
    title: "Smart Irrigation System Setup",
    description: "Complete guide to setting up automated irrigation based on soil moisture sensors",
    type: "video",
    category: "Irrigation",
    duration: "12:30",
    difficulty: "beginner",
    rating: 4.8,
    views: 1250,
    thumbnail: "/irrigation-system-setup-tutorial.jpg",
  },
  {
    id: "2",
    title: "Soil Sensor Calibration Manual",
    description: "Step-by-step instructions for calibrating soil moisture and pH sensors",
    type: "guide",
    category: "Sensors",
    difficulty: "intermediate",
    rating: 4.6,
    views: 890,
  },
  {
    id: "3",
    title: "Crop Rotation Planning",
    description: "Learn how to plan effective crop rotations using sensor data",
    type: "video",
    category: "Farming",
    duration: "18:45",
    difficulty: "intermediate",
    rating: 4.9,
    views: 2100,
    thumbnail: "/crop-rotation-planning-diagram.jpg",
  },
  {
    id: "4",
    title: "Motor Control System Manual",
    description: "Technical documentation for water pump and motor control systems",
    type: "manual",
    category: "Hardware",
    difficulty: "advanced",
    rating: 4.5,
    views: 650,
  },
  {
    id: "5",
    title: "Weather Data Integration",
    description: "How to integrate weather forecasts with your irrigation decisions",
    type: "video",
    category: "Weather",
    duration: "15:20",
    difficulty: "intermediate",
    rating: 4.7,
    views: 1450,
    thumbnail: "/weather-data-integration-dashboard.jpg",
  },
  {
    id: "6",
    title: "Troubleshooting Common Issues",
    description: "Solutions to frequently encountered problems with smart farming systems",
    type: "guide",
    category: "Support",
    difficulty: "beginner",
    rating: 4.4,
    views: 980,
  },
]

export default function DocumentationHub() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  const categories = ["all", ...Array.from(new Set(documentationData.map((item) => item.category)))]
  const types = ["all", "guide", "video", "manual"]

  const filteredData = documentationData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesType = selectedType === "all" || item.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "guide":
        return <BookOpen className="h-4 w-4" />
      case "manual":
        return <Download className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Documentation & Learning Hub</h2>
            <p className="text-gray-400">Comprehensive guides, tutorials, and resources for smart farming</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
            <TabsList className="bg-gray-800/50 border-gray-700">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  {category === "all" ? "All Categories" : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-auto">
            <TabsList className="bg-gray-800/50 border-gray-700">
              {types.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <Card
            key={item.id}
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200 group"
          >
            <CardHeader className="pb-3">
              {item.thumbnail && (
                <div className="relative overflow-hidden rounded-lg mb-3">
                  <img
                    src={item.thumbnail || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {item.type === "video" && item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {item.duration}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                <Badge className={getDifficultyColor(item.difficulty)}>{item.difficulty}</Badge>
              </div>

              <CardTitle className="text-white group-hover:text-green-400 transition-colors">{item.title}</CardTitle>
              <CardDescription className="text-gray-400">{item.description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{item.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{item.views.toLocaleString()}</span>
                  </div>
                  {item.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                onClick={() => {
                  console.log(`[v0] Opening ${item.type}: ${item.title}`)
                  // In a real app, this would open the actual documentation/video
                  alert(`Opening ${item.type}: ${item.title}`)
                }}
              >
                {item.type === "video" ? "Watch Video" : item.type === "manual" ? "Download Manual" : "Read Guide"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No documentation found</h3>
          <p className="text-gray-400">Try adjusting your search terms or filters</p>
        </div>
      )}

      {/* Quick Access Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Access</CardTitle>
          <CardDescription className="text-gray-400">
            Frequently accessed resources and emergency guides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-gray-700 hover:bg-gray-700/50 bg-transparent"
            >
              <Video className="h-6 w-6 text-green-400" />
              <div className="text-center">
                <div className="font-medium text-white">System Setup</div>
                <div className="text-xs text-gray-400">Getting Started</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-gray-700 hover:bg-gray-700/50 bg-transparent"
            >
              <BookOpen className="h-6 w-6 text-blue-400" />
              <div className="text-center">
                <div className="font-medium text-white">Troubleshooting</div>
                <div className="text-xs text-gray-400">Common Issues</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-gray-700 hover:bg-gray-700/50 bg-transparent"
            >
              <Download className="h-6 w-6 text-purple-400" />
              <div className="text-center">
                <div className="font-medium text-white">API Docs</div>
                <div className="text-xs text-gray-400">Technical Reference</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-gray-700 hover:bg-gray-700/50 bg-transparent"
            >
              <Users className="h-6 w-6 text-orange-400" />
              <div className="text-center">
                <div className="font-medium text-white">Community</div>
                <div className="text-xs text-gray-400">Forums & Support</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
