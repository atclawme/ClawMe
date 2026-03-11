'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadioGroup as _RadioGroup, RadioGroupItem as _RadioGroupItem } from '@/components/ui/radio-group'
import { Label as _Label } from '@/components/ui/label'
import { Button as _Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Input as _Input } from '@/components/ui/input'

const RadioGroup = _RadioGroup as any;
const RadioGroupItem = _RadioGroupItem as any;
const Label = _Label as any;
const Button = _Button as any;
const Input = _Input as any;

interface WaitlistSurveyProps {
  email: string
}

const SOURCES = [
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'github', label: 'GitHub' },
  { id: 'referral', label: 'Friend / Referral' },
  { id: 'other', label: 'Other' },
]

export default function WaitlistSurvey({ email }: WaitlistSurveyProps) {
  const [source, setSource] = useState<string>('')
  const [otherDetails, setOtherDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!source) return
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          referral_source: source,
          other_details: source === 'other' ? otherDetails : undefined
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Failed to submit survey', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-12 text-center">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4"
          >
            <p className="text-[#8E8EA0] text-sm">
              Thanks for the feedback! It helps us grow.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="survey"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-t border-[#3F3F50] pt-10 mt-10">
              <h4 className="text-[18px] font-semibold text-[#F0F0F5] mb-2">
                How did you find out about us?
              </h4>
              <p className="text-[14px] text-[#8E8EA0] mb-8">
                Optional — helps us understand where our first users are coming from.
              </p>

              <RadioGroup
                value={source}
                onValueChange={setSource}
                className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left"
              >
                {SOURCES.map((s) => (
                  <div key={s.id} className="flex items-center space-x-3 bg-[#1C1C28] p-3 rounded-lg border border-[#3F3F50] hover:border-[#6C47FF] transition-colors cursor-pointer" onClick={() => setSource(s.id)}>
                    <RadioGroupItem value={s.id} id={s.id} className="border-[#6C47FF] text-[#6C47FF]" />
                    <Label htmlFor={s.id} className="text-[#F0F0F5] text-sm cursor-pointer font-medium">
                      {s.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {source === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 max-w-md mx-auto"
                >
                  <Input
                    placeholder="Tell us more..."
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    className="bg-[#1C1C28] border-[#3F3F50] text-[#F0F0F5] focus:border-[#6C47FF] h-10"
                  />
                </motion.div>
              )}

              <div className="mt-8">
                <Button
                  onClick={handleSubmit}
                  disabled={!source || loading}
                  className="bg-transparent hover:bg-white/5 text-[#F0F0F5] border border-[#3F3F50] hover:border-[#F0F0F5] transition-all px-8"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit
                </Button>
                <button
                  onClick={() => setSubmitted(true)}
                  className="block mx-auto mt-4 text-[13px] text-[#52525B] hover:text-[#8E8EA0] transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
