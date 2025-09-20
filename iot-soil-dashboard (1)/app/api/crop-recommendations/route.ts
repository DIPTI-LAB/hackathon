import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

export async function GET() {
  try {
    const supabase = await createClient()

    // Get latest sensor reading
    const { data: sensorData, error: sensorError } = await supabase
      .from("sensor_readings")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    if (sensorError) {
      console.error("Error fetching sensor data:", sensorError)
      return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
    }

    // Generate crop recommendations based on sensor data
    const recommendations = generateCropRecommendations(sensorData)

    // Store recommendations in database
    try {
      const { error: insertError } = await supabase.from("crop_recommendations").insert(
        recommendations.map((rec) => ({
          crop_type: rec.crop_type,
          recommendation_text: rec.recommendation_text,
          confidence_score: rec.suitability_score / 100,
          based_on_reading_id: sensorData.id,
        })),
      )

      if (insertError) {
        console.error("Error storing recommendations:", insertError)
      }
    } catch (err) {
      console.log("Database storage optional, continuing with recommendations")
    }

    return NextResponse.json({
      recommendations,
      sensor_data: {
        soil_moisture: sensorData.soil_moisture,
        soil_temperature: sensorData.soil_temperature,
        air_temperature: sensorData.air_temperature,
        air_humidity: sensorData.air_humidity,
        pressure: sensorData.pressure,
        rainfall: sensorData.rainfall,
        ammonia: sensorData.ammonia,
        timestamp: sensorData.timestamp,
      },
      analysis_date: new Date(),
    })
  } catch (error) {
    console.error("Crop recommendation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCropRecommendations(sensorData: any): CropRecommendation[] {
  const { soil_moisture, soil_temperature, air_temperature, air_humidity, pressure, rainfall, ammonia } = sensorData

  const recommendations: CropRecommendation[] = []

  // Tomatoes
  const tomatoScore = calculateCropSuitability({
    soil_moisture,
    soil_temperature,
    air_temperature,
    air_humidity,
    optimal: {
      soil_moisture: [40, 70],
      soil_temperature: [18, 24],
      air_temperature: [20, 30],
      air_humidity: [50, 70],
    },
  })

  recommendations.push({
    crop_type: "Tomatoes",
    suitability_score: tomatoScore,
    recommendation_text: getTomatoRecommendation(sensorData, tomatoScore),
    planting_season: "Spring to Early Summer",
    expected_yield: "15-25 kg per plant",
    care_instructions: [
      "Water regularly but avoid overwatering",
      "Provide support stakes or cages",
      "Prune suckers for better fruit development",
      "Monitor for pests like aphids and whiteflies",
    ],
    growth_duration: "75-85 days",
    water_requirements: "Moderate to High",
    temperature_range: "20-30°C optimal",
  })

  // Lettuce
  const lettuceScore = calculateCropSuitability({
    soil_moisture,
    soil_temperature,
    air_temperature,
    air_humidity,
    optimal: {
      soil_moisture: [50, 80],
      soil_temperature: [10, 18],
      air_temperature: [15, 25],
      air_humidity: [60, 80],
    },
  })

  recommendations.push({
    crop_type: "Lettuce",
    suitability_score: lettuceScore,
    recommendation_text: getLettuceRecommendation(sensorData, lettuceScore),
    planting_season: "Cool seasons - Spring and Fall",
    expected_yield: "200-400g per head",
    care_instructions: [
      "Keep soil consistently moist",
      "Provide partial shade in hot weather",
      "Harvest outer leaves first for continuous growth",
      "Watch for slugs and aphids",
    ],
    growth_duration: "45-65 days",
    water_requirements: "High",
    temperature_range: "15-25°C optimal",
  })

  // Peppers
  const pepperScore = calculateCropSuitability({
    soil_moisture,
    soil_temperature,
    air_temperature,
    air_humidity,
    optimal: {
      soil_moisture: [35, 65],
      soil_temperature: [20, 28],
      air_temperature: [22, 32],
      air_humidity: [40, 60],
    },
  })

  recommendations.push({
    crop_type: "Peppers",
    suitability_score: pepperScore,
    recommendation_text: getPepperRecommendation(sensorData, pepperScore),
    planting_season: "Late Spring to Summer",
    expected_yield: "1-2 kg per plant",
    care_instructions: [
      "Allow soil to dry slightly between waterings",
      "Provide warm, sunny location",
      "Support heavy-fruited varieties",
      "Regular feeding with balanced fertilizer",
    ],
    growth_duration: "70-90 days",
    water_requirements: "Moderate",
    temperature_range: "22-32°C optimal",
  })

  // Spinach
  const spinachScore = calculateCropSuitability({
    soil_moisture,
    soil_temperature,
    air_temperature,
    air_humidity,
    optimal: {
      soil_moisture: [60, 85],
      soil_temperature: [8, 16],
      air_temperature: [10, 20],
      air_humidity: [65, 85],
    },
  })

  recommendations.push({
    crop_type: "Spinach",
    suitability_score: spinachScore,
    recommendation_text: getSpinachRecommendation(sensorData, spinachScore),
    planting_season: "Cool weather - Early Spring and Fall",
    expected_yield: "150-300g per plant",
    care_instructions: [
      "Keep soil consistently moist",
      "Provide shade in warm weather",
      "Harvest leaves when young and tender",
      "Succession plant every 2 weeks",
    ],
    growth_duration: "30-45 days",
    water_requirements: "High",
    temperature_range: "10-20°C optimal",
  })

  // Carrots
  const carrotScore = calculateCropSuitability({
    soil_moisture,
    soil_temperature,
    air_temperature,
    air_humidity,
    optimal: {
      soil_moisture: [45, 75],
      soil_temperature: [12, 20],
      air_temperature: [16, 24],
      air_humidity: [50, 70],
    },
  })

  recommendations.push({
    crop_type: "Carrots",
    suitability_score: carrotScore,
    recommendation_text: getCarrotRecommendation(sensorData, carrotScore),
    planting_season: "Spring and Fall",
    expected_yield: "100-200g per root",
    care_instructions: [
      "Ensure deep, loose soil for straight roots",
      "Thin seedlings to prevent crowding",
      "Keep soil evenly moist",
      "Avoid fresh manure which causes forked roots",
    ],
    growth_duration: "70-80 days",
    water_requirements: "Moderate",
    temperature_range: "16-24°C optimal",
  })

  // Sort by suitability score
  return recommendations.sort((a, b) => b.suitability_score - a.suitability_score)
}

function calculateCropSuitability(params: {
  soil_moisture: number
  soil_temperature: number
  air_temperature: number
  air_humidity: number
  optimal: {
    soil_moisture: [number, number]
    soil_temperature: [number, number]
    air_temperature: [number, number]
    air_humidity: [number, number]
  }
}): number {
  const { soil_moisture, soil_temperature, air_temperature, air_humidity, optimal } = params

  const scores = [
    calculateParameterScore(soil_moisture, optimal.soil_moisture),
    calculateParameterScore(soil_temperature, optimal.soil_temperature),
    calculateParameterScore(air_temperature, optimal.air_temperature),
    calculateParameterScore(air_humidity, optimal.air_humidity),
  ]

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function calculateParameterScore(value: number, optimal: [number, number]): number {
  const [min, max] = optimal
  const mid = (min + max) / 2
  const range = max - min

  if (value >= min && value <= max) {
    // Within optimal range, score based on distance from center
    const distanceFromCenter = Math.abs(value - mid)
    return 100 - (distanceFromCenter / (range / 2)) * 20 // Max penalty of 20 points
  } else {
    // Outside optimal range, penalty based on distance
    const distance = value < min ? min - value : value - max
    const penalty = Math.min(distance * 5, 80) // Max penalty of 80 points
    return Math.max(20, 100 - penalty) // Minimum score of 20
  }
}

function getTomatoRecommendation(sensorData: any, score: number): string {
  const { soil_moisture, air_temperature } = sensorData

  if (score >= 80) {
    return "Excellent conditions for tomatoes! Your soil moisture and temperature are ideal for healthy growth and fruit production."
  } else if (score >= 60) {
    return `Good conditions for tomatoes. ${
      soil_moisture < 40
        ? "Consider increasing irrigation frequency."
        : soil_moisture > 70
          ? "Reduce watering to prevent root rot."
          : ""
    } ${air_temperature > 30 ? "Provide shade during hottest parts of the day." : ""}`
  } else {
    return `Challenging conditions for tomatoes. ${
      air_temperature < 20
        ? "Temperature is too cool - consider greenhouse or wait for warmer weather."
        : air_temperature > 35
          ? "Temperature is too hot - provide shade and increase watering."
          : ""
    } Monitor soil moisture closely.`
  }
}

function getLettuceRecommendation(sensorData: any, score: number): string {
  const { soil_moisture, air_temperature } = sensorData

  if (score >= 80) {
    return "Perfect conditions for lettuce! Cool temperatures and adequate moisture will produce crisp, tender leaves."
  } else if (score >= 60) {
    return `Good conditions for lettuce. ${
      air_temperature > 25 ? "Provide afternoon shade to prevent bolting." : ""
    } ${soil_moisture < 50 ? "Increase watering frequency for best leaf quality." : ""}`
  } else {
    return `Difficult conditions for lettuce. ${
      air_temperature > 30
        ? "Too hot - lettuce will bolt quickly. Consider heat-tolerant varieties or wait for cooler weather."
        : ""
    } Ensure consistent soil moisture.`
  }
}

function getPepperRecommendation(sensorData: any, score: number): string {
  const { soil_moisture, air_temperature } = sensorData

  if (score >= 80) {
    return "Excellent conditions for peppers! Warm temperatures and moderate moisture will promote healthy fruit development."
  } else if (score >= 60) {
    return `Good conditions for peppers. ${
      air_temperature < 22 ? "Consider using row covers or greenhouse protection." : ""
    } ${soil_moisture > 65 ? "Allow soil to dry slightly between waterings." : ""}`
  } else {
    return `Challenging conditions for peppers. ${
      air_temperature < 18 ? "Too cool for peppers - wait for warmer weather or use protection." : ""
    } Adjust watering based on soil moisture levels.`
  }
}

function getSpinachRecommendation(sensorData: any, score: number): string {
  const { soil_moisture, air_temperature } = sensorData

  if (score >= 80) {
    return "Ideal conditions for spinach! Cool temperatures and high moisture will produce tender, flavorful leaves."
  } else if (score >= 60) {
    return `Good conditions for spinach. ${
      air_temperature > 20 ? "Provide shade to prevent early bolting." : ""
    } ${soil_moisture < 60 ? "Increase watering for optimal leaf development." : ""}`
  } else {
    return `Poor conditions for spinach. ${
      air_temperature > 25 ? "Too warm - spinach will bolt quickly. Wait for cooler weather." : ""
    } Maintain consistent soil moisture.`
  }
}

function getCarrotRecommendation(sensorData: any, score: number): string {
  const { soil_moisture, air_temperature } = sensorData

  if (score >= 80) {
    return "Great conditions for carrots! Moderate temperatures and consistent moisture will produce straight, sweet roots."
  } else if (score >= 60) {
    return `Good conditions for carrots. ${
      soil_moisture > 75 ? "Reduce watering to prevent root rot and splitting." : ""
    } ${air_temperature > 24 ? "Provide mulch to keep soil cool." : ""}`
  } else {
    return `Challenging conditions for carrots. ${
      air_temperature > 28 ? "Too warm - roots may become bitter and tough." : ""
    } Ensure consistent but not excessive soil moisture.`
  }
}
