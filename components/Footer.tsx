import Link from 'next/link'
import { Youtube, Instagram, Twitter, Linkedin, Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">VidMaxx</span>
            </div>
            <p className="mb-6 max-w-md text-muted-foreground">
              AI-powered video generation and scheduling platform for creators and businesses. 
              Create once, publish everywhere.
            </p>
            <div className="flex gap-4">
              {[Youtube, Instagram, Twitter, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="rounded-lg border p-2 hover:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="space-y-3">
              {['Features', 'Pricing', 'Use Cases', 'Updates'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="space-y-3">
              {['Documentation', 'Blog', 'Tutorials', 'API'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-3">
              {['About', 'Careers', 'Contact', 'Privacy'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VidMaxx. All rights reserved.</p>
          <p className="mt-2">
            AI Short Video Generator and Scheduler for YouTube, Instagram, TikTok and Email
          </p>
        </div>
      </div>
    </footer>
  )
}
