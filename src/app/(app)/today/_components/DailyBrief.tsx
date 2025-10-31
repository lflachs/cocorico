'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import type { DailyInsights } from '@/lib/services/insights.service';

interface DailyBriefProps {
  summary: string;
  isAllGood?: boolean;
  insights: DailyInsights;
}

/**
 * DailyBrief - Hero section with natural language summary
 * Shows the most important insight of the day in plain language
 */
export function DailyBrief({ summary, isAllGood = false, insights }: DailyBriefProps) {
  const { language, t } = useLanguage();
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  // Prepare initial context for voice assistant
  const initialContext = {
    briefSummary: insights.briefSummary,
    stats: {
      totalReorderNeeded: insights.stats.totalReorderNeeded,
      urgentReorders: insights.stats.urgentReorders,
      expiringCount: insights.stats.expiringCount,
      expiringValue: insights.stats.expiringValue,
    },
    menuReady: insights.menuStatus.allReady,
    totalActiveDishes: insights.menuStatus.totalActive,
  };

  return (
    <Card className="shadow-xl border-0 overflow-hidden relative">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        isAllGood
          ? 'from-green-50/60 via-green-50/10 to-transparent dark:from-green-950/10 dark:via-green-950/5 dark:to-transparent'
          : 'from-blue-50/60 via-blue-50/10 to-transparent dark:from-blue-950/10 dark:via-blue-950/5 dark:to-transparent'
      }`} />

      <CardContent className="relative pt-6 pb-6 px-4 sm:pt-8 sm:pb-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${
            isAllGood
              ? 'bg-gradient-to-br from-success to-success/80'
              : 'bg-gradient-to-br from-primary to-primary/80'
          } shadow-lg`}>
            {isAllGood ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {t('today.brief.greeting') || 'Cocorico, Nico!'}
            </h3>
            <div className="text-base sm:text-lg text-foreground leading-7 sm:leading-relaxed space-y-3 whitespace-pre-wrap overflow-x-hidden break-words">
              {summary.split('\n\n').map((paragraph, idx) => {
                // Convert **bold** markdown to actual bold
                const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={idx} className="leading-7 sm:leading-relaxed">
                    {parts.map((part, partIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={partIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>

            {/* Consultation Button */}
            <div className="mt-5 sm:mt-6">
              <Button
                onClick={() => setIsConsultationOpen(true)}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-3 text-base py-6"
              >
                <MessageCircle className="w-5 h-5" />
                {language === 'fr' ? 'Discuter avec Cocorico' : 'Talk to Cocorico'}
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Assistant Dialog */}
        <VoiceAssistant
          mode="consultation"
          initialContext={initialContext}
          isOpen={isConsultationOpen}
          onOpenChange={setIsConsultationOpen}
        />
      </CardContent>
    </Card>
  );
}
