// ThingsSpeak API client utilities

export interface SensorReading {
  temperature: number
  humidity: number
  moisture: number
  gasLevel: number
  uvRadiation: number
  timestamp: Date
  fallback?: boolean
}

export interface HistoricalData {
  time: string
  temperature: number
  humidity: number
  moisture: number
  gasLevel: number
  uvRadiation: number
  timestamp: Date
}

export class ThingSpeakClient {
  private baseUrl = "/api/thingspeak"

  async getLatestReading(): Promise<SensorReading> {
    try {
      const response = await fetch(`${this.baseUrl}?type=latest`, {
        next: { revalidate: 30 }, // Cache for 30 seconds
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      }
    } catch (error) {
      console.error("Failed to fetch latest reading:", error)
      throw error
    }
  }

  async getHistoricalData(results = 24): Promise<HistoricalData[]> {
    try {
      const response = await fetch(`${this.baseUrl}?type=historical&results=${results}`, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.feeds.map((feed: any) => ({
        ...feed,
        timestamp: new Date(feed.timestamp),
      }))
    } catch (error) {
      console.error("Failed to fetch historical data:", error)
      throw error
    }
  }

  async writeData(data: {
    field1?: number // temperature
    field2?: number // humidity
    field3?: number // moisture
    field4?: number // gasLevel
    field5?: number // uvRadiation
  }): Promise<boolean> {
    // This would be used to write data to ThingsSpeak from sensors
    // Implementation depends on your write API key and requirements
    console.log("Writing data to ThingsSpeak:", data)
    return true
  }
}

export const thingSpeakClient = new ThingSpeakClient()
