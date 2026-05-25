import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateStepFooterProps {
  onBack?: () => void
  onContinue: () => void
  canContinue: boolean
  isLastStep?: boolean
  className?: string
}

export function CreateStepFooter({
  onBack,
  onContinue,
  canContinue,
  isLastStep = false,
  className
}: CreateStepFooterProps) {
  return (
    <div className={cn("flex w-full items-center justify-between border-t bg-background pt-6 mt-8", className)}>
      <div>
        {onBack && (
          <Button variant="outline" size="lg" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>
      <div>
        <Button 
          size="lg" 
          onClick={onContinue} 
          disabled={!canContinue}
          className="min-w-[150px]"
        >
          {isLastStep ? "Finish" : "Continue"}
          {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
