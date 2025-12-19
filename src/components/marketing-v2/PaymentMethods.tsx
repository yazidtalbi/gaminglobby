'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

const paymentMethods = {
  deposits: [
    { name: 'Credit Card', fee: '0%', min: '$5', max: '$10,000' },
    { name: 'PayPal', fee: '0%', min: '$10', max: '$5,000' },
    { name: 'Crypto', fee: '0%', min: '$5', max: 'Unlimited' },
  ],
  cashout: [
    { name: 'PayPal', fee: '0%', min: '$10', max: '$5,000' },
    { name: 'Bank Transfer', fee: '0%', min: '$50', max: '$10,000' },
    { name: 'Crypto', fee: '0%', min: '$5', max: 'Unlimited' },
  ],
}

export function PaymentMethods() {
  const [activeTab, setActiveTab] = useState('deposits')

  return (
    <section className="relative z-10 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl lg:text-5xl font-title font-bold text-white mb-4 text-center">
          CHOOSE FROM SECURE PAYMENT METHODS
        </h2>
        <p className="text-xl text-slate-400 text-center mb-12">
          For easy deposits and withdrawals (Early Access: All methods free)
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="deposits" className="flex-1">
              DEPOSITS
            </TabsTrigger>
            <TabsTrigger value="cashout" className="flex-1">
              CASH OUT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposits">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.deposits.map((method, index) => (
                <Card
                  key={index}
                  className="border-slate-800 bg-slate-900/50"
                >
                  <CardContent className="p-6">
                    <div className="text-lg font-semibold text-white mb-4">
                      {method.name}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Fee:</span>
                        <span className="text-cyan-400 font-semibold">
                          {method.fee}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Min:</span>
                        <span className="text-white">{method.min}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Max:</span>
                        <span className="text-white">{method.max}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cashout">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.cashout.map((method, index) => (
                <Card
                  key={index}
                  className="border-slate-800 bg-slate-900/50"
                >
                  <CardContent className="p-6">
                    <div className="text-lg font-semibold text-white mb-4">
                      {method.name}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Fee:</span>
                        <span className="text-cyan-400 font-semibold">
                          {method.fee}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Min:</span>
                        <span className="text-white">{method.min}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Max:</span>
                        <span className="text-white">{method.max}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
