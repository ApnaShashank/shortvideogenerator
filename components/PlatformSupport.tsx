import { Card, CardContent } from '@/components/ui/card'
import { Youtube, Instagram, MessageSquare, Mail } from 'lucide-react'

const platforms = [
  {
    icon: Youtube,
    name: "YouTube Shorts",
    color: "text-red-600",
    description: "Optimized for YouTube's short-form format"
  },
  {
    icon: Instagram,
    name: "Instagram Reels",
    color: "text-pink-600",
    description: "Perfectly formatted for Instagram"
  },
  {
    icon: MessageSquare,
    name: "TikTok",
    color: "text-black",
    description: "Native TikTok format support"
  },
  {
    icon: Mail,
    name: "Email Campaigns",
    color: "text-blue-600",
    description: "Convert videos for email marketing"
  }
]

export default function PlatformSupport() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Multi-Platform Support
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            One tool for all your video platforms
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {platforms.map((platform, index) => (
            <Card key={index} className="border transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className={`rounded-lg bg-muted p-3 ${platform.color}`}>
                    <platform.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{platform.name}</h3>
                </div>
                <p className="text-muted-foreground">{platform.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
