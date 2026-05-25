"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clapperboard, 
  Trash2, 
  Calendar, 
  Sparkles,
  Plus,
  Tv
} from "lucide-react"
import { deleteProject } from "@/actions/project"
import { toast } from "sonner"
import Link from 'next/link'

interface ProjectData {
  _id: string
  name: string
  description?: string
  brandColor?: string
  isActive: boolean
  createdAt: string
}

interface SeriesListProps {
  series: ProjectData[]
}

export function SeriesList({ series: initialSeries }: SeriesListProps) {
  const [seriesList, setSeriesList] = useState<ProjectData[]>(initialSeries)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this series project? This will not delete previously generated videos but will stop active automated generation schedules.")) {
      return
    }

    try {
      const response = await deleteProject(id)
      if (response.success) {
        setSeriesList(prev => prev.filter(item => item._id !== id))
        toast.success("Series project deleted successfully!")
      } else {
        toast.error(response.error || "Failed to delete series.")
      }
    } catch (error) {
      toast.error("An error occurred during deletion.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Your Video Series</h2>
          <p className="text-muted-foreground text-sm">Automate recurring short video releases for specific niches.</p>
        </div>
        <Button asChild className="gap-1.5 shadow-sm">
          <Link href="/dashboard/create">
            <Plus className="h-4 w-4" /> Create New Series
          </Link>
        </Button>
      </div>

      {seriesList.length === 0 ? (
        <Card className="py-16 text-center border-dashed border-2 flex flex-col items-center justify-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Tv className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg font-bold">No Active Series</CardTitle>
          <CardDescription className="max-w-xs mx-auto mt-2">
            You don't have any video series created yet. Start automating your content creation today.
          </CardDescription>
          <Button asChild className="mt-6 gap-2" variant="outline">
            <Link href="/dashboard/create">
              <Plus className="h-4 w-4" /> Create Your First Series
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seriesList.map((project) => {
            const formattedDate = mounted 
              ? new Date(project.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : ""

            return (
              <Card key={project._id} className="overflow-hidden border hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <CardHeader className="bg-muted/10 border-b pb-4 relative">
                    <div className="absolute top-4 right-4">
                      <Badge variant={project.isActive ? "default" : "secondary"}>
                        {project.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Clapperboard className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold truncate pr-16">{project.name}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description || "Automated short video series template."}
                    </p>
                    
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Created on {formattedDate}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-2 border-t flex items-center justify-between">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/create`}>
                      Edit Settings
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(project._id)}
                    title="Delete Series"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
