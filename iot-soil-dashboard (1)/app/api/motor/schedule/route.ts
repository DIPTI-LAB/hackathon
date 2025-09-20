import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Create irrigation schedule table if it doesn't exist
const createScheduleTable = async (supabase: any) => {
  const { error } = await supabase.rpc("create_schedule_table_if_not_exists")
  if (error) {
    console.log("Schedule table creation handled by migration scripts")
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get irrigation schedules (this would be from a schedules table in a real implementation)
    // For now, return a mock schedule
    const mockSchedule = [
      {
        id: 1,
        name: "Morning Irrigation",
        time: "06:00",
        duration: 30, // minutes
        days: ["monday", "wednesday", "friday"],
        active: true,
        conditions: {
          min_soil_moisture: 25,
          max_rainfall: 2,
        },
      },
      {
        id: 2,
        name: "Evening Irrigation",
        time: "18:00",
        duration: 20,
        days: ["tuesday", "thursday", "saturday"],
        active: true,
        conditions: {
          min_soil_moisture: 30,
          max_rainfall: 1,
        },
      },
    ]

    return NextResponse.json({
      schedules: mockSchedule,
      message: "Irrigation schedules retrieved successfully",
    })
  } catch (error) {
    console.error("Schedule API Error:", error)
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, time, duration, days, conditions } = await request.json()

    // Validate input
    if (!name || !time || !duration || !days) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real implementation, this would save to a schedules table
    const newSchedule = {
      id: Date.now(), // Mock ID
      name,
      time,
      duration,
      days,
      active: true,
      conditions: conditions || { min_soil_moisture: 30, max_rainfall: 2 },
      created_at: new Date(),
    }

    return NextResponse.json({
      schedule: newSchedule,
      message: "Irrigation schedule created successfully",
    })
  } catch (error) {
    console.error("Schedule creation error:", error)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}
