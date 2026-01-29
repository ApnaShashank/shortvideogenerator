import { Zap, Calendar, Brain, BarChart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Zap,
    title: "AI Video Generation",
    description: "Generate engaging short videos automatically using advanced AI algorithms tailored for each platform."
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Auto-schedule posts for optimal times across all platforms with intelligent timezone handling."
  },
  {
    icon: Brain,
    title: "Platform Optimization",
    description: "AI automatically formats and optimizes content specifically for YouTube, Instagram, TikTok, and Email."
  },
  {
    icon: BarChart,
    title: "Analytics & Insights",
    description: "Track performance and get AI-powered recommendations to improve engagement and reach."
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need for Video Success
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            From creation to scheduling to analytics - we've got you covered
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
