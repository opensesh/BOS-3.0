'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsSectionHeader } from './SettingsSection';
import { Check, Zap, Building2, Rocket } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  icon: typeof Zap;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals just getting started',
    price: '$0',
    priceUnit: '/month',
    icon: Zap,
    features: [
      'Up to 3 projects',
      '1 team member',
      'Basic analytics',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams and businesses',
    price: '$10',
    priceUnit: '/user/month',
    icon: Rocket,
    features: [
      'Unlimited projects',
      'Up to 20 team members',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 'Custom',
    priceUnit: '',
    icon: Building2,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'SSO/SAML',
      'Dedicated support',
      'Custom contracts',
      'SLA guarantee',
      'On-premise option',
    ],
  },
];

export function PlanForm() {
  const t = useTranslations('settings.plan');
  const [currentPlan, setCurrentPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="max-w-5xl">
      <SettingsSectionHeader
        title={t('title')}
        description={t('subtitle')}
      />

      {/* Current Plan Banner */}
      <div className="
        flex items-center justify-between
        p-4
        bg-[var(--bg-brand-primary)]
        border border-[var(--border-brand)]
        rounded-xl
        mb-8
      ">
        <div className="flex items-center gap-3">
          <div className="
            w-10 h-10
            bg-[var(--bg-brand-solid)]
            rounded-lg
            flex items-center justify-center
          ">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--fg-primary)]">
              You're currently on the <span className="text-[var(--fg-brand-primary)]">Pro plan</span>
            </p>
            <p className="text-sm text-[var(--fg-tertiary)]">
              Your next billing date is January 1, 2026
            </p>
          </div>
        </div>
        <button className="
          px-4 py-2
          text-sm font-semibold text-[var(--fg-tertiary)]
          hover:text-[var(--fg-secondary)]
          transition-colors
        ">
          Cancel subscription
        </button>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="
          inline-flex items-center
          p-1
          bg-[var(--bg-secondary-alt)]
          border border-[var(--border-secondary)]
          rounded-lg
        ">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`
              px-4 py-2
              rounded-md
              text-sm font-semibold
              transition-all
              ${billingCycle === 'monthly'
                ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }
            `}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`
              px-4 py-2
              rounded-md
              text-sm font-semibold
              transition-all
              ${billingCycle === 'yearly'
                ? 'bg-[var(--bg-primary)] text-[var(--fg-primary)] shadow-sm'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]'
              }
            `}
          >
            Yearly
            <span className="ml-2 text-xs text-[var(--fg-success-primary)]">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = plan.id === currentPlan;

          return (
            <div
              key={plan.id}
              className={`
                relative
                flex flex-col
                p-6
                bg-[var(--bg-primary)]
                border rounded-2xl
                transition-all
                ${isCurrentPlan
                  ? 'border-[var(--border-brand)] ring-2 ring-[var(--border-brand)]'
                  : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)]'
                }
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="
                  absolute -top-3 left-1/2 -translate-x-1/2
                  px-3 py-1
                  bg-[var(--bg-brand-solid)]
                  rounded-full
                  text-xs font-semibold text-white
                ">
                  Most popular
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`
                  w-10 h-10
                  ${plan.id === 'free' ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-brand-solid)]'}
                  rounded-lg
                  flex items-center justify-center
                `}>
                  <Icon className={`w-5 h-5 ${plan.id === 'free' ? 'text-[var(--fg-tertiary)]' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
                    {plan.name}
                  </h3>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-semibold text-[var(--fg-primary)]">
                  {plan.price}
                </span>
                <span className="text-sm text-[var(--fg-tertiary)]">
                  {plan.priceUnit}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--fg-tertiary)] mb-6">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[var(--fg-success-primary)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--fg-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                disabled={isCurrentPlan}
                className={`
                  w-full
                  px-4 py-2.5
                  rounded-lg
                  text-sm font-semibold
                  transition-colors
                  ${isCurrentPlan
                    ? 'bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] cursor-not-allowed'
                    : plan.popular
                      ? 'bg-[var(--bg-brand-solid)] text-[var(--fg-white)] hover:bg-[var(--bg-brand-solid\_hover)]'
                      : 'bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary-alt)]'
                  }
                `}
              >
                {isCurrentPlan ? 'Current plan' : plan.id === 'enterprise' ? 'Contact sales' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Usage Stats */}
      <div className="mt-8 p-6 bg-[var(--bg-secondary-alt)] border border-[var(--border-secondary)] rounded-xl">
        <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-4">
          Current usage
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-[var(--fg-tertiary)]">Projects</p>
            <p className="text-2xl font-semibold text-[var(--fg-primary)]">12 / ∞</p>
            <div className="mt-2 h-2 bg-[var(--bg-quaternary)] rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-[var(--bg-brand-solid)] rounded-full" />
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--fg-tertiary)]">Team members</p>
            <p className="text-2xl font-semibold text-[var(--fg-primary)]">8 / 20</p>
            <div className="mt-2 h-2 bg-[var(--bg-quaternary)] rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-[var(--bg-brand-solid)] rounded-full" />
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--fg-tertiary)]">Storage</p>
            <p className="text-2xl font-semibold text-[var(--fg-primary)]">4.2 / 10 GB</p>
            <div className="mt-2 h-2 bg-[var(--bg-quaternary)] rounded-full overflow-hidden">
              <div className="h-full w-[42%] bg-[var(--bg-brand-solid)] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

