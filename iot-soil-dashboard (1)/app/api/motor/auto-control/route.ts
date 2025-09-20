import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
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

    // Get current motor status
    const { data: motorData, error: motorError } = await supabase
      .from("motor_control")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (motorError) {
      console.error("Error fetching motor status:", motorError)
      return NextResponse.json({ error: "Failed to fetch motor status" }, { status: 500 })
    }

    // Only proceed if motor is in automatic mode
    if (motorData.mode !== "automatic") {
      return NextResponse.json({
        message: "Motor is in manual mode, automatic control disabled",
        action: "none",
        current_status: motorData.status,
      })
    }

    // Determine if motor should be activated based on sensor data
    const shouldActivate = determineMotorAction(sensorData)
    const currentStatus = motorData.status

    // Only update if status needs to change
    if (shouldActivate !== currentStatus) {
      const reason = generateAutoControlReason(sensorData, shouldActivate)

      // Update motor status
      const { data: newMotorData, error: updateError } = await supabase
        .from("motor_control")
        .insert([
          {
            status: shouldActivate,
            mode: "automatic",
            reason,
            changed_by: "system",
          },
        ])
        .select()
        .single()

      if (updateError) {
        console.error("Error updating motor status:", updateError)
        return NextResponse.json({ error: "Failed to update motor status" }, { status: 500 })
      }

      // Simulate hardware command
      await simulateMotorCommand(shouldActivate, "automatic", reason)

      return NextResponse.json({
        message: `Motor ${shouldActivate ? "activated" : "deactivated"} automatically`,
        action: shouldActivate ? "activated" : "deactivated",
        reason,
        sensor_data: {
          soil_moisture: sensorData.soil_moisture,
          air_temperature: sensorData.air_temperature,
          air_humidity: sensorData.air_humidity,
        },
        new_status: newMotorData,
      })
    }

    return NextResponse.json({
      message: "No action needed, motor status optimal",
      action: "none",
      current_status: currentStatus,
      sensor_data: {
        soil_moisture: sensorData.soil_moisture,
        air_temperature: sensorData.air_temperature,
        air_humidity: sensorData.air_humidity,
      },
    })
  } catch (error) {
    console.error("Auto control error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function determineMotorAction(sensorData: any): boolean {
  const { soil_moisture, air_temperature, air_humidity, rainfall } = sensorData

  // Don't water if it's raining
  if (rainfall > 1) {
    return false
  }

  // Activate motor if soil moisture is low
  if (soil_moisture < 30) {
    return true
  }

  // Deactivate motor if soil moisture is adequate or high
  if (soil_moisture > 60) {
    return false
  }

  // Consider temperature and humidity for edge cases
  if (soil_moisture < 40 && air_temperature > 30 && air_humidity < 50) {
    // Hot and dry conditions, activate even with moderate soil moisture
    return true
  }

  // Default: maintain current status for borderline cases
  return false
}

function generateAutoControlReason(sensorData: any, shouldActivate: boolean): string {
  const { soil_moisture, air_temperature, air_humidity, rainfall } = sensorData

  if (rainfall > 1) {
    return `Deactivated due to rainfall (${rainfall.toFixed(1)}mm)`
  }

  if (shouldActivate) {
    if (soil_moisture < 20) {
      return `Critical soil moisture level (${soil_moisture.toFixed(1)}%) - immediate irrigation required`
    } else if (soil_moisture < 30) {
      return `Low soil moisture (${soil_moisture.toFixed(1)}%) - irrigation activated`
    } else if (air_temperature > 30 && air_humidity < 50) {
      return `Hot and dry conditions (${air_temperature.toFixed(1)}°C, ${air_humidity.toFixed(1)}% humidity) - preventive irrigation`
    }
  } else {
    if (soil_moisture > 70) {
      return `High soil moisture (${soil_moisture.toFixed(1)}%) - irrigation not needed`
    } else if (soil_moisture > 60) {
      return `Adequate soil moisture (${soil_moisture.toFixed(1)}%) - irrigation deactivated`
    }
  }

  return `Automatic control based on sensor readings: ${soil_moisture.toFixed(1)}% moisture, ${air_temperature.toFixed(1)}°C temperature`
}

async function simulateMotorCommand(status: boolean, mode: string, reason?: string) {
  console.log(`[AUTO MOTOR CONTROL] ${status ? "STARTING" : "STOPPING"} motor`)
  console.log(`[AUTO MOTOR CONTROL] Reason: ${reason}`)
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log(`[AUTO MOTOR CONTROL] Command executed successfully`)
}
