import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current motor status
    const { data, error } = await supabase
      .from("motor_control")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching motor status:", error)
      return NextResponse.json(
        {
          status: false,
          mode: "automatic",
          reason: "Database connection error",
          changed_by: "system",
          created_at: new Date(),
          error: true,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      ...data,
      created_at: new Date(data.created_at),
      error: false,
    })
  } catch (error) {
    console.error("Motor API Error:", error)
    return NextResponse.json(
      {
        status: false,
        mode: "automatic",
        reason: "System error",
        changed_by: "system",
        created_at: new Date(),
        error: true,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { status, mode, reason, changed_by } = await request.json()

    // Validate input
    if (typeof status !== "boolean") {
      return NextResponse.json({ error: "Status must be boolean" }, { status: 400 })
    }

    if (!["automatic", "manual"].includes(mode)) {
      return NextResponse.json({ error: "Mode must be 'automatic' or 'manual'" }, { status: 400 })
    }

    if (!["system", "user"].includes(changed_by)) {
      return NextResponse.json({ error: "Changed_by must be 'system' or 'user'" }, { status: 400 })
    }

    const supabase = await createClient()

    // Insert new motor status
    const { data, error } = await supabase
      .from("motor_control")
      .insert([
        {
          status,
          mode,
          reason: reason || `Motor ${status ? "activated" : "deactivated"} via ${mode} mode`,
          changed_by,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error updating motor status:", error)
      return NextResponse.json({ error: "Failed to update motor status" }, { status: 500 })
    }

    // Simulate sending command to actual motor hardware
    await simulateMotorCommand(status, mode, reason)

    return NextResponse.json({
      ...data,
      created_at: new Date(data.created_at),
      success: true,
    })
  } catch (error) {
    console.error("Motor control error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Simulate motor hardware command
async function simulateMotorCommand(status: boolean, mode: string, reason?: string) {
  // In a real implementation, this would send commands to IoT hardware
  console.log(`[MOTOR CONTROL] ${status ? "STARTING" : "STOPPING"} motor`)
  console.log(`[MOTOR CONTROL] Mode: ${mode}`)
  console.log(`[MOTOR CONTROL] Reason: ${reason}`)

  // Simulate hardware response delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log(`[MOTOR CONTROL] Motor ${status ? "STARTED" : "STOPPED"} successfully`)
}
