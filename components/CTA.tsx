import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CTA() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl bg-linear-to-r from-primary/10 to-primary/5 border p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Video Content?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of creators and marketers using VidMaxx
            </p>
            
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item) => (
                <div key={item} className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/signup">
                  Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">
                  Schedule a Demo
                </Link>
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              No setup fees • No long-term contracts • Priority support included
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
