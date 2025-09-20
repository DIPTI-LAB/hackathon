import { createClient } from "@/lib/supabase/client"

export interface SensorReading {
  id?: string
  soil_moisture: number
  soil_temperature: number
  soil_humidity: number
  air_temperature: number
  air_humidity: number
  pressure: number
  rainfall: number
  ammonia: number
  timestamp: Date
  created_at?: Date
}

export interface MotorStatus {
  id?: string
  status: boolean
  mode: "automatic" | "manual"
  reason?: string
  changed_by: "system" | "user"
  created_at: Date
}

export class SmartFarmClient {
  private supabase = createClient()

  // Get latest sensor reading
  async getLatestReading(): Promise<SensorReading> {
    try {
      const { data, error } = await this.supabase
        .from("sensor_readings")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) {
        console.log("[v0] No sensor readings found in database, using demo data")
        return this.generateDemoReading()
      }

      const reading = data[0]
      return {
        ...reading,
        timestamp: new Date(reading.timestamp),
        created_at: reading.created_at ? new Date(reading.created_at) : new Date(),
      }
    } catch (error) {
      console.error("Error fetching latest reading:", error)
      // Return demo data as fallback
      return this.generateDemoReading()
    }
  }

  // Get historical sensor data
  async getHistoricalData(hours = 24): Promise<SensorReading[]> {
    try {
      const { data, error } = await this.supabase
        .from("sensor_readings")
        .select("*")
        .gte("timestamp", new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order("timestamp", { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        console.log("[v0] No historical data found, using demo data")
        return this.generateDemoHistoricalData(hours)
      }

      return data.map((reading) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
        created_at: reading.created_at ? new Date(reading.created_at) : new Date(),
      }))
    } catch (error) {
      console.error("Error fetching historical data:", error)
      // Return demo data as fallback
      return this.generateDemoHistoricalData(hours)
    }
  }

  // Add new sensor reading
  async addSensorReading(reading: Omit<SensorReading, "id" | "created_at">): Promise<SensorReading> {
    const { data, error } = await this.supabase.from("sensor_readings").insert([reading]).select()

    if (error) throw error

    const insertedReading = Array.isArray(data) ? data[0] : data
    return {
      ...insertedReading,
      timestamp: new Date(insertedReading.timestamp),
      created_at: new Date(insertedReading.created_at),
    }
  }

  // Get current motor status
  async getMotorStatus(): Promise<MotorStatus> {
    try {
      const { data, error } = await this.supabase
        .from("motor_control")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      if (!data || data.length === 0) {
        console.log("[v0] No motor status found, creating default status")
        // Create initial motor status
        return await this.updateMotorStatus(false, "automatic", "Initial system setup", "system")
      }

      const status = data[0]
      return {
        ...status,
        created_at: new Date(status.created_at),
      }
    } catch (error) {
      console.error("Error fetching motor status:", error)
      // Return default status
      return {
        status: false,
        mode: "automatic",
        reason: "System default - database error",
        changed_by: "system",
        created_at: new Date(),
      }
    }
  }

  // Update motor status
  async updateMotorStatus(
    status: boolean,
    mode: "automatic" | "manual",
    reason: string,
    changed_by: "system" | "user",
  ): Promise<MotorStatus> {
    const { data, error } = await this.supabase
      .from("motor_control")
      .insert([
        {
          status,
          mode,
          reason,
          changed_by,
        },
      ])
      .select()

    if (error) throw error

    const insertedStatus = Array.isArray(data) ? data[0] : data
    return {
      ...insertedStatus,
      created_at: new Date(insertedStatus.created_at),
    }
  }

  async seedInitialData(): Promise<void> {
    try {
      // Add some initial sensor readings
      const readings = Array.from({ length: 10 }, (_, i) => {
        const time = new Date(Date.now() - i * 60 * 60 * 1000) // Every hour for last 10 hours
        return {
          ...this.generateDemoReading(),
          timestamp: time.toISOString(),
        }
      })

      const { error } = await this.supabase.from("sensor_readings").insert(readings)
      if (error) {
        console.error("Error seeding sensor data:", error)
      } else {
        console.log("[v0] Successfully seeded initial sensor data")
      }
    } catch (error) {
      console.error("Error in seedInitialData:", error)
    }
  }

  // Generate demo sensor reading for fallback
  private generateDemoReading(): SensorReading {
    return {
      soil_moisture: Math.max(0, Math.min(100, 45 + (Math.random() - 0.5) * 20)),
      soil_temperature: Math.max(0, Math.min(50, 22 + (Math.random() - 0.5) * 8)),
      soil_humidity: Math.max(0, Math.min(100, 60 + (Math.random() - 0.5) * 25)),
      air_temperature: Math.max(-10, Math.min(50, 24 + (Math.random() - 0.5) * 10)),
      air_humidity: Math.max(0, Math.min(100, 65 + (Math.random() - 0.5) * 30)),
      pressure: Math.max(95, Math.min(110, 101.3 + (Math.random() - 0.5) * 2)),
      rainfall: Math.max(0, Math.random() * 5),
      ammonia: Math.max(0, Math.min(50, 15 + (Math.random() - 0.5) * 10)),
      timestamp: new Date(),
    }
  }

  // Generate demo historical data for fallback
  private generateDemoHistoricalData(hours: number): SensorReading[] {
    return Array.from({ length: Math.min(hours, 48) }, (_, i) => {
      const time = new Date(Date.now() - i * 60 * 60 * 1000)
      return {
        ...this.generateDemoReading(),
        timestamp: time,
      }
    }).reverse()
  }
}

export const smartFarmClient = new SmartFarmClient()
