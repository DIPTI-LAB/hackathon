import { NextResponse } from "next/server"

// Ollama API configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface SensorContext {
  temperature: number
  humidity: number
  moisture: number
  gasLevel: number
  uvRadiation: number
  timestamp: string
}

export async function POST(request: Request) {
  try {
    const { message, sensorData } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Create agricultural context prompt
    const systemPrompt = createAgriculturalSystemPrompt(sensorData)

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ]

    // Call Ollama API
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500,
        },
      }),
    })

    if (!response.ok) {
      // Fallback response if Ollama is not available
      const fallbackResponse = generateFallbackResponse(message, sensorData)
      return NextResponse.json({
        message: fallbackResponse,
        fallback: true,
      })
    }

    const data = await response.json()

    return NextResponse.json({
      message: data.message?.content || "Sorry, I could not generate a response.",
      fallback: false,
    })
  } catch (error) {
    console.error("Chat API Error:", error)

    // Return fallback response
    try {
      const { message, sensorData } = await request.json()
      const fallbackResponse = generateFallbackResponse(message, sensorData)

      return NextResponse.json({
        message: fallbackResponse,
        fallback: true,
      })
    } catch (parseError) {
      return NextResponse.json({
        message: "I'm having trouble understanding your request. Please try again.",
        fallback: true,
      })
    }
  }
}

function createAgriculturalSystemPrompt(sensorData?: SensorContext): string {
  const currentData = sensorData
    ? `
Current Sensor Readings:
- Air Temperature: ${sensorData.temperature}°C
- Air Humidity: ${sensorData.humidity}%
- Soil Moisture: ${sensorData.moisture}%
- Ammonia Level: ${sensorData.gasLevel} ppm
- UV Radiation: ${sensorData.uvRadiation} UV Index
- Last Updated: ${sensorData.timestamp}
`
    : ""

  return `You are an expert agricultural AI assistant specializing in precision farming and IoT-based agriculture. You have access to real-time sensor data from a smart farming system.

${currentData}

Your expertise includes:
1. Soil health analysis and management
2. Irrigation optimization and water management
3. Crop selection and rotation planning
4. Pest and disease identification and management
5. Fertilization strategies and nutrient management
6. Weather impact assessment
7. Harvest timing and yield optimization
8. Sustainable farming practices

Guidelines for responses:
- Always reference current sensor data when providing recommendations
- Provide specific, actionable advice with clear steps
- Consider environmental factors and their interactions
- Suggest both immediate actions and long-term strategies
- Include safety considerations for any chemical applications
- Explain the reasoning behind your recommendations
- Be concise but thorough in your responses
- Use farmer-friendly language while maintaining technical accuracy

Focus on practical, science-based agricultural guidance that can be implemented immediately based on the current conditions.`
}

function generateFallbackResponse(message: string, sensorData?: SensorContext): string {
  const lowerMessage = message.toLowerCase()

  // Enhanced fallback responses with more detailed analysis
  if (sensorData) {
    const { temperature, humidity, moisture, gasLevel, uvRadiation } = sensorData

    // Crop recommendation queries
    if (lowerMessage.includes("crop") || lowerMessage.includes("plant")) {
      if (temperature >= 20 && temperature <= 30 && moisture >= 40) {
        return `Based on your current conditions (${temperature}°C, ${moisture}% soil moisture), this is excellent for warm-season crops like tomatoes, peppers, and cucumbers. The soil moisture of ${moisture}% is ideal for most vegetables. Consider planting within the next few days if you haven't already.`
      } else if (temperature < 20 && moisture >= 40) {
        return `With cooler temperatures (${temperature}°C) and good soil moisture (${moisture}%), this is perfect for cool-season crops like lettuce, spinach, kale, and peas. These crops will thrive in your current conditions.`
      } else {
        return `Current conditions: ${temperature}°C and ${moisture}% soil moisture. Consider adjusting irrigation before planting. Most crops prefer soil moisture between 40-60% for optimal germination.`
      }
    }

    // Irrigation and watering queries
    if (lowerMessage.includes("water") || lowerMessage.includes("irrigation") || lowerMessage.includes("moisture")) {
      if (moisture < 25) {
        return `URGENT: Your soil moisture is critically low at ${moisture}%. Immediate irrigation is needed. Water deeply and slowly to ensure proper soil penetration. Check again in 2-3 hours and maintain moisture between 40-60% for most crops.`
      } else if (moisture < 35) {
        return `Your soil moisture is low at ${moisture}%. Increase irrigation frequency. Water early morning (6-8 AM) or late evening (6-8 PM) to minimize evaporation. Monitor daily and aim for 40-60% moisture.`
      } else if (moisture > 75) {
        return `Soil moisture is high at ${moisture}%. Reduce watering frequency to prevent root rot and fungal issues. Ensure proper drainage and allow soil to dry to 60-65% before next watering. Check for standing water around plants.`
      } else {
        return `Your soil moisture level of ${moisture}% is in the optimal range (40-60%). Maintain current irrigation schedule but monitor daily, especially with temperature at ${temperature}°C. Adjust watering based on weather forecasts.`
      }
    }

    // Temperature-related queries
    if (lowerMessage.includes("temperature") || lowerMessage.includes("heat") || lowerMessage.includes("cold")) {
      if (temperature > 32) {
        return `High temperature alert: ${temperature}°C is stressful for most crops. Provide shade cloth (30-50% shade), increase watering frequency, and harvest early morning. Consider misting systems for cooling. Monitor plants for heat stress signs.`
      } else if (temperature < 10) {
        return `Low temperature warning: ${temperature}°C may damage sensitive crops. Use row covers, cold frames, or greenhouse protection. Focus on cold-hardy crops like spinach, kale, and winter radishes. Avoid planting warm-season crops.`
      } else if (temperature >= 15 && temperature <= 25) {
        return `Excellent temperature conditions at ${temperature}°C! This is ideal for most crops. Perfect time for planting, transplanting, and general garden maintenance. Most vegetables will thrive in these conditions.`
      }
    }

    // Humidity-related queries
    if (lowerMessage.includes("humidity")) {
      if (humidity > 85) {
        return `Very high humidity at ${humidity}% increases disease risk significantly. Improve air circulation, space plants properly, and monitor for fungal diseases like powdery mildew, blight, and rust. Consider preventive fungicide applications.`
      } else if (humidity < 30) {
        return `Low humidity at ${humidity}% may stress plants and increase water needs. Consider misting systems, mulching heavily, or windbreaks to increase local humidity. Monitor plants for wilting and increase watering frequency.`
      } else {
        return `Humidity level of ${humidity}% is within acceptable range (30-70%). Continue monitoring, especially during weather changes. Good humidity levels support healthy plant growth and reduce stress.`
      }
    }

    // Pest and disease queries
    if (lowerMessage.includes("pest") || lowerMessage.includes("disease") || lowerMessage.includes("bug")) {
      let riskLevel = "moderate"
      if (humidity > 80 && temperature > 25) riskLevel = "high"
      if (humidity < 40 && temperature < 20) riskLevel = "low"

      return `Current conditions indicate ${riskLevel} pest/disease risk (${temperature}°C, ${humidity}% humidity). ${
        riskLevel === "high"
          ? "High risk conditions - inspect plants daily, improve air circulation, and be ready with organic treatments like neem oil or insecticidal soap."
          : riskLevel === "low"
            ? "Low risk conditions - maintain regular monitoring and good garden hygiene."
            : "Moderate risk - weekly plant inspections recommended, maintain good sanitation practices."
      } Always use integrated pest management approaches first.`
    }

    // Air quality / ammonia queries
    if (lowerMessage.includes("ammonia") || lowerMessage.includes("gas") || lowerMessage.includes("air quality")) {
      if (gasLevel > 25) {
        return `High ammonia levels detected (${gasLevel} ppm). This may indicate over-fertilization or poor ventilation. Reduce nitrogen fertilizer applications, improve air circulation, and ensure proper composting practices. High ammonia can burn plant roots and leaves.`
      } else if (gasLevel > 15) {
        return `Elevated ammonia levels (${gasLevel} ppm). Monitor fertilizer applications and ensure organic matter is properly composted before use. Good levels for soil health but watch for any increases.`
      } else {
        return `Ammonia levels are normal (${gasLevel} ppm). This indicates good soil health and proper nutrient cycling. Continue current fertilization practices.`
      }
    }
  }

  // General recommendations without sensor data
  if (lowerMessage.includes("fertilizer") || lowerMessage.includes("nutrients") || lowerMessage.includes("feed")) {
    return `For optimal plant nutrition, start with a soil test to determine specific nutrient needs. Generally, apply balanced fertilizer (10-10-10 or 5-5-5) during growing season. Organic options include compost, aged manure, fish emulsion, and kelp meal. Apply when soil moisture is adequate for proper uptake. Avoid over-fertilizing which can burn plants and pollute groundwater.`
  }

  if (lowerMessage.includes("organic") || lowerMessage.includes("natural")) {
    return `Organic farming practices include: composting kitchen scraps and yard waste, using cover crops to improve soil, companion planting for pest control, crop rotation to prevent disease, and beneficial insect habitats. Natural pest control options include neem oil, diatomaceous earth, beneficial nematodes, and encouraging birds and beneficial insects.`
  }

  if (lowerMessage.includes("harvest") || lowerMessage.includes("pick") || lowerMessage.includes("ready")) {
    return `Harvest timing depends on the crop, but general signs include: proper color development, slight give when gently squeezed (for fruits), easy separation from plant, and peak flavor when tasted. Harvest in early morning when plants are fully hydrated. Most vegetables taste best when harvested young and tender.`
  }

  // Default helpful response
  return `I'm here to help with your farming questions! I can provide advice on:

• Irrigation and water management
• Crop selection and planting timing  
• Soil health and fertilization
• Pest and disease management
• Harvest timing and techniques
• Weather impact assessment
• Sustainable farming practices

What specific aspect of farming would you like guidance on? If you have sensor data available, I can provide more targeted recommendations based on your current conditions.`
}
