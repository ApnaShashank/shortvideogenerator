import { Card, CardContent } from '@/components/ui/card'
import { Input, Upload, Settings, Send } from 'lucide-react'

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Input Your Content",
    description: "Add text, images, or voiceovers - our AI understands your vision"
  },
  {
    number: "02",
    icon: Upload,
    title: "AI Generates Videos",
    description: "Our AI creates platform-optimized videos in multiple formats"
  },
  {
    number: "03",
    icon: Settings,
    title: "Customize & Schedule",
    description: "Edit, add branding, and set automatic posting schedules"
  },
  {
    number: "04",
    icon: Send,
    title: "Auto-Post & Analyze",
    description: "Videos go live automatically and you track performance"
  }
]

export default function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            How VidMaxx Works
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Four simple steps from idea to published video
          </p>
        </div>
        
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-4 top-12 h-[2px] w-[calc(100%-2rem)] bg-border md:left-1/2 md:top-24 md:h-[calc(100%-6rem)] md:w-[2px] md:-translate-x-1/2" />
          
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {steps.map((step, index) => (
              <Card 
                key={index} 
                className={`relative border ${index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'} md:w-[90%]`}
              >
                <CardContent className="p-6">
                  <div className="absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground md:-left-6">
                    <span className="text-sm font-bold">{step.number}</span>
                  </div>
                  
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
