import { type NextRequest, NextResponse } from "next/server"

// Dummy Twilio credentials - user will update these later
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "your_auth_token_here"
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+1234567890"

export async function POST(request: NextRequest) {
  try {
    const { to, message, type = "manual" } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    // Mock SMS sending for now - replace with actual Twilio API call
    const mockResponse = {
      sid: `SM${Math.random().toString(36).substring(2, 15)}`,
      to,
      from: TWILIO_PHONE_NUMBER,
      body: message,
      status: "sent",
      dateCreated: new Date().toISOString(),
      type,
    }

    // In production, you would use Twilio SDK:
    /*
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    const smsResponse = await twilio.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to
    })
    */

    console.log(`[SMS] ${type.toUpperCase()} SMS sent to ${to}: ${message}`)

    return NextResponse.json({
      success: true,
      data: mockResponse,
      message: "SMS sent successfully",
    })
  } catch (error) {
    console.error("SMS sending error:", error)
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
  }
}
