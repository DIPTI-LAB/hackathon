import { type NextRequest, NextResponse } from "next/server"
import { smartFarmClient } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, alertTypes } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Get latest sensor data
    const sensorData = await smartFarmClient.getLatestReading()
    const alerts = []

    // Check for critical conditions based on alert types
    if (alertTypes.includes("soil_moisture") && sensorData.soil_moisture < 25) {
      alerts.push({
        type: "soil_moisture",
        message: `🚨 CRITICAL: Soil moisture is very low at ${sensorData.soil_moisture.toFixed(1)}%. Immediate irrigation recommended!`,
        severity: "critical",
      })
    }

    if (alertTypes.includes("temperature") && (sensorData.air_temperature > 35 || sensorData.air_temperature < 10)) {
      alerts.push({
        type: "temperature",
        message: `⚠️ WARNING: Extreme air temperature detected: ${sensorData.air_temperature.toFixed(1)}°C. Monitor crops closely.`,
        severity: "warning",
      })
    }

    if (alertTypes.includes("ammonia") && sensorData.ammonia > 30) {
      alerts.push({
        type: "ammonia",
        message: `🔴 ALERT: High ammonia levels detected: ${sensorData.ammonia.toFixed(1)} ppm. Check ventilation systems.`,
        severity: "high",
      })
    }

    if (alertTypes.includes("pressure") && sensorData.pressure < 99) {
      alerts.push({
        type: "pressure",
        message: `🌧️ WEATHER: Low pressure detected (${sensorData.pressure.toFixed(1)} kPa). Rain likely within 24 hours.`,
        severity: "info",
      })
    }

    // Send SMS alerts
    const sentAlerts = []
    for (const alert of alerts) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/sms/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: phoneNumber,
            message: alert.message,
            type: "alert",
          }),
        })

        if (response.ok) {
          sentAlerts.push(alert)
        }
      } catch (error) {
        console.error(`Failed to send ${alert.type} alert:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      alertsFound: alerts.length,
      alertsSent: sentAlerts.length,
      alerts: sentAlerts,
      sensorData: {
        soil_moisture: sensorData.soil_moisture,
        air_temperature: sensorData.air_temperature,
        ammonia: sensorData.ammonia,
        pressure: sensorData.pressure,
        timestamp: sensorData.timestamp,
      },
    })
  } catch (error) {
    console.error("Alert checking error:", error)
    return NextResponse.json({ error: "Failed to check alerts" }, { status: 500 })
  }
}
