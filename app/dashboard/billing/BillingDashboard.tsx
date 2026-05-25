"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  CreditCard, 
  Coins, 
  Check, 
  Loader2 
} from "lucide-react"
import { addCreditsMock, upgradeSubscriptionMock } from "@/actions/billing"
import { toast } from "sonner"

interface BillingDashboardProps {
  initialCredits: number
  initialTier: 'free' | 'pro' | 'business'
  initialStatus: string
  initialPeriodEnd?: string
}

export function BillingDashboard({ 
  initialCredits, 
  initialTier, 
  initialStatus, 
  initialPeriodEnd 
}: BillingDashboardProps) {
  const [credits, setCredits] = useState(initialCredits)
  const [tier, setTier] = useState(initialTier)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleBuyCredits = async (amount: number, price: string, key: string) => {
    setLoadingAction(key)
    try {
      const response = await addCreditsMock(amount, `Purchased ${amount} credits pack for ${price}`)
      if (response.success) {
        setCredits(response.newCredits!)
        toast.success(`Successfully added ${amount} credits! (Simulation)`)
      } else {
        toast.error(response.error || "Failed to add credits.")
      }
    } catch (error) {
      toast.error("An error occurred.")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleUpgrade = async (selectedTier: 'pro' | 'business', key: string) => {
    setLoadingAction(key)
    try {
      const response = await upgradeSubscriptionMock(selectedTier)
      if (response.success) {
        setCredits(response.newCredits!)
        setTier(response.tier!)
        toast.success(`Successfully upgraded to ${selectedTier.toUpperCase()} plan! (Simulation)`)
      } else {
        toast.error(response.error || "Failed to upgrade subscription.")
      }
    } catch (error) {
      toast.error("An error occurred.")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-semibold flex items-center gap-1">
              <Coins className="h-4 w-4" /> Credits Balance
            </CardDescription>
            <CardTitle className="text-4xl font-extrabold flex items-center gap-1.5 mt-1">
              {credits} <span className="text-xs font-normal text-muted-foreground">remaining</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">Each video generation consumes 1 credit.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold flex items-center gap-1">
              <CreditCard className="h-4 w-4" /> Active Subscription
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold capitalize flex items-center gap-2 mt-1">
              {tier} Plan
              <Badge variant="outline" className="capitalize text-xs font-semibold py-0.5 border-primary/50 text-primary">
                {initialStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground">
              {tier === 'free' 
                ? "Upgrade to Pro to unlock automated daily posting." 
                : `Next billing cycle: ${initialPeriodEnd ? new Date(initialPeriodEnd).toLocaleDateString('en-US') : '30 days from now'}`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Bundles */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Purchase Credit Packs</h3>
          <p className="text-muted-foreground text-sm">Need quick credits? Buy high-speed rendering credits instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: "pack-100", amount: 100, price: "$9.99", desc: "Perfect for testing scripts and templates." },
            { id: "pack-500", amount: 500, price: "$39.99", desc: "Best for running a full weekly automated short series." }
          ].map((pack) => {
            const isLoading = loadingAction === pack.id
            return (
              <Card key={pack.id} className="flex flex-col justify-between hover:shadow-sm transition-all border">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex justify-between items-center">
                    {pack.amount} Credits
                    <span className="text-primary font-extrabold">{pack.price}</span>
                  </CardTitle>
                  <CardDescription>{pack.desc}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={() => handleBuyCredits(pack.amount, pack.price, pack.id)}
                    disabled={loadingAction !== null}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Coins className="h-4 w-4 mr-1.5" />}
                    Buy {pack.amount} Credits (Mock Checkout)
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Upgrade Subscription</h3>
          <p className="text-muted-foreground text-sm">Scale your short video channels with recurring monthly plans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro */}
          <Card className={`flex flex-col justify-between relative border ${tier === 'pro' ? 'border-primary shadow-sm' : ''}`}>
            {tier === 'pro' && (
              <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                CURRENT PLAN
              </span>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex justify-between items-center">
                Pro Plan
                <span className="text-2xl font-extrabold">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
              </CardTitle>
              <CardDescription>Ideal for individual creators looking to automate channels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 500 bonus credits included monthly</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Enable daily automated video postings</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> HD Video rendering & voice clones</li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Button 
                className="w-full" 
                variant={tier === 'pro' ? "outline" : "default"}
                onClick={() => handleUpgrade('pro', 'upgrade-pro')}
                disabled={loadingAction !== null || tier === 'pro'}
              >
                {loadingAction === 'upgrade-pro' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                {tier === 'pro' ? 'Active' : 'Upgrade to Pro'}
              </Button>
            </CardFooter>
          </Card>

          {/* Business */}
          <Card className={`flex flex-col justify-between relative border ${tier === 'business' ? 'border-primary shadow-sm' : ''}`}>
            {tier === 'business' && (
              <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                CURRENT PLAN
              </span>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex justify-between items-center">
                Business Plan
                <span className="text-2xl font-extrabold">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
              </CardTitle>
              <CardDescription>Best for agency automation & multi-channel publishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 2,000 bonus credits included monthly</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited automated scheduling</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Priority processing speed (Render in seconds)</li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Button 
                className="w-full" 
                variant={tier === 'business' ? "outline" : "default"}
                onClick={() => handleUpgrade('business', 'upgrade-business')}
                disabled={loadingAction !== null || tier === 'business'}
              >
                {loadingAction === 'upgrade-business' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                {tier === 'business' ? 'Active' : 'Upgrade to Business'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
