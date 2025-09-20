-- Create sensor_readings table for storing all sensor data
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soil_moisture DECIMAL(5,2) NOT NULL,
  soil_temperature DECIMAL(5,2) NOT NULL,
  soil_humidity DECIMAL(5,2) NOT NULL,
  air_temperature DECIMAL(5,2) NOT NULL,
  air_humidity DECIMAL(5,2) NOT NULL,
  pressure DECIMAL(7,2) NOT NULL,
  rainfall DECIMAL(6,2) NOT NULL DEFAULT 0,
  ammonia DECIMAL(6,2) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create motor_control table for tracking motor status
CREATE TABLE IF NOT EXISTS public.motor_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status BOOLEAN NOT NULL DEFAULT FALSE, -- true = on, false = off
  mode VARCHAR(20) NOT NULL DEFAULT 'automatic', -- 'automatic' or 'manual'
  reason TEXT, -- reason for status change
  changed_by VARCHAR(50) DEFAULT 'system', -- 'system' or 'user'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crop_recommendations table for storing AI recommendations
CREATE TABLE IF NOT EXISTS public.crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type VARCHAR(100) NOT NULL,
  recommendation_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  based_on_reading_id UUID REFERENCES sensor_readings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial motor status
INSERT INTO public.motor_control (status, mode, reason, changed_by)
VALUES (FALSE, 'automatic', 'Initial setup', 'system')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_motor_control_created_at ON motor_control(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crop_recommendations_created_at ON crop_recommendations(created_at DESC);
