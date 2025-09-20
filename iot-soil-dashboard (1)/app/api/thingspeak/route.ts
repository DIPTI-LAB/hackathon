import { NextResponse } from "next/server"

// ThingsSpeak API configuration
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY
const THINGSPEAK_BASE_URL = "https://api.thingspeak.com"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "latest"
  const results = searchParams.get("results") || "1"

  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_API_KEY || THINGSPEAK_READ_API_KEY === "demo_key") {
    console.log("ThingsSpeak API keys not configured, using demo data")

    // Return mock data immediately when API keys are not configured
    if (type === "latest") {
      return NextResponse.json({
        temperature: 24.5 + (Math.random() - 0.5) * 4,
        humidity: 65 + (Math.random() - 0.5) * 20,
        moisture: 42 + (Math.random() - 0.5) * 15,
        gasLevel: 350 + (Math.random() - 0.5) * 50,
        uvRadiation: 6.2 + (Math.random() - 0.5) * 2,
        timestamp: new Date(),
        fallback: true,
        reason: "API keys not configured",
      })
    } else {
      // Return mock historical data
      const mockFeeds = Array.from({ length: Number.parseInt(results) }, (_, i) => {
        const time = new Date(Date.now() - i * 60 * 60 * 1000)
        return {
          temperature: 24.5 + (Math.random() - 0.5) * 8,
          humidity: 65 + (Math.random() - 0.5) * 30,
          moisture: 42 + (Math.random() - 0.5) * 20,
          gasLevel: 350 + (Math.random() - 0.5) * 100,
          uvRadiation: 6.2 + (Math.random() - 0.5) * 4,
          timestamp: time,
          time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
      }).reverse()

      return NextResponse.json({
        channel: { name: "Soil Quality Monitor (Demo)" },
        feeds: mockFeeds,
        fallback: true,
        reason: "API keys not configured",
      })
    }
  }

  try {
    let url: string

    if (type === "latest") {
      // Get latest sensor reading
      url = `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${THINGSPEAK_READ_API_KEY}`
    } else if (type === "historical") {
      // Get historical data (last 24 hours)
      url = `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=${results}`
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control for real-time data
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ThingsSpeak API error: ${response.status} - ${errorText}`)
      throw new Error(`ThingsSpeak API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data || (type === "historical" && !data.feeds)) {
      throw new Error("Invalid data received from ThingsSpeak")
    }

    // Transform ThingsSpeak data to our sensor data format
    if (type === "latest") {
      if (!data.created_at) {
        throw new Error("No recent data available from ThingsSpeak")
      }

      const transformedData = {
        temperature: Number.parseFloat(data.field1) || 0,
        humidity: Number.parseFloat(data.field2) || 0,
        moisture: Number.parseFloat(data.field3) || 0,
        gasLevel: Number.parseFloat(data.field4) || 0,
        uvRadiation: Number.parseFloat(data.field5) || 0,
        timestamp: new Date(data.created_at),
        thingspeakData: data,
      }
      return NextResponse.json(transformedData)
    } else {
      // Transform historical data
      const transformedFeeds =
        data.feeds?.map((feed: any) => ({
          temperature: Number.parseFloat(feed.field1) || 0,
          humidity: Number.parseFloat(feed.field2) || 0,
          moisture: Number.parseFloat(feed.field3) || 0,
          gasLevel: Number.parseFloat(feed.field4) || 0,
          uvRadiation: Number.parseFloat(feed.field5) || 0,
          timestamp: new Date(feed.created_at),
          time: new Date(feed.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })) || []

      return NextResponse.json({
        channel: data.channel,
        feeds: transformedFeeds,
      })
    }
  } catch (error) {
    console.error("ThingsSpeak API Error:", error)

    // Return mock data as fallback
    if (type === "latest") {
      return NextResponse.json({
        temperature: 24.5 + (Math.random() - 0.5) * 4,
        humidity: 65 + (Math.random() - 0.5) * 20,
        moisture: 42 + (Math.random() - 0.5) * 15,
        gasLevel: 350 + (Math.random() - 0.5) * 50,
        uvRadiation: 6.2 + (Math.random() - 0.5) * 2,
        timestamp: new Date(),
        fallback: true,
        reason: error instanceof Error ? error.message : "API connection failed",
      })
    } else {
      // Return mock historical data
      const mockFeeds = Array.from({ length: Number.parseInt(results) }, (_, i) => {
        const time = new Date(Date.now() - i * 60 * 60 * 1000)
        return {
          temperature: 24.5 + (Math.random() - 0.5) * 8,
          humidity: 65 + (Math.random() - 0.5) * 30,
          moisture: 42 + (Math.random() - 0.5) * 20,
          gasLevel: 350 + (Math.random() - 0.5) * 100,
          uvRadiation: 6.2 + (Math.random() - 0.5) * 4,
          timestamp: time,
          time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
      }).reverse()

      return NextResponse.json({
        channel: { name: "Soil Quality Monitor (Demo)" },
        feeds: mockFeeds,
        fallback: true,
        reason: error instanceof Error ? error.message : "API connection failed",
      })
    }
  }
}
