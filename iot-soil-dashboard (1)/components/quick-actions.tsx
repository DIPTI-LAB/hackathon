"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Bell, Download, Calendar, BarChart3 } from "lucide-react"

interface QuickActionsProps {
  onIrrigate?: () => void
  onSetAlert?: () => void
  onExportData?: () => void
  onSchedule?: () => void
}

export function QuickActions({ onIrrigate, onSetAlert, onExportData, onSchedule }: QuickActionsProps) {
  const actions = [
    {
      icon: <Droplets className="h-4 w-4" />,
      label: "Start Irrigation",
      onClick: onIrrigate,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: <Bell className="h-4 w-4" />,
      label: "Set Alert",
      onClick: onSetAlert,
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      icon: <Download className="h-4 w-4" />,
      label: "Export Data",
      onClick: onExportData,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Schedule",
      onClick: onSchedule,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <Card className="glass card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className={`${action.color} text-white border-none hover:scale-105 transition-all duration-200`}
            >
              {action.icon}
              <span className="ml-2 text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
