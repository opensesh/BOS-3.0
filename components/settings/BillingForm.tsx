'use client';

import { useState } from 'react';
import {
  SettingsSectionHeader,
  SettingsField,
  SettingsSectionFooter,
} from './SettingsSection';
import {
  CreditCard,
  Plus,
  Download,
  MoreVertical,
  Check,
  Mail,
  ChevronDown,
} from 'lucide-react';

// Mock payment methods data
const MOCK_PAYMENT_METHODS = [
  {
    id: '1',
    type: 'visa',
    last4: '1234',
    expiry: '06/2025',
    isDefault: true,
  },
  {
    id: '2',
    type: 'mastercard',
    last4: '1234',
    expiry: '06/2025',
    isDefault: false,
  },
  {
    id: '3',
    type: 'apple_pay',
    last4: '1234',
    expiry: '06/2025',
    isDefault: false,
  },
];

// Mock billing history data
const MOCK_INVOICES = [
  {
    id: 'INV-001122025',
    admin: { name: 'Olivia Rhye', email: 'olivia@opensession.co', avatar: '' },
    usersOnPlan: 8,
    amount: '$10.00',
    date: 'Dec 1, 2025',
    status: 'paid',
  },
  {
    id: 'INV-001112025',
    admin: { name: 'Olivia Rhye', email: 'olivia@opensession.co', avatar: '' },
    usersOnPlan: 8,
    amount: '$10.00',
    date: 'Nov 1, 2025',
    status: 'paid',
  },
  {
    id: 'INV-001102025',
    admin: { name: 'Olivia Rhye', email: 'olivia@opensession.co', avatar: '' },
    usersOnPlan: 8,
    amount: '$10.00',
    date: 'Oct 1, 2025',
    status: 'paid',
  },
  {
    id: 'INV-001092025',
    admin: { name: 'Olivia Rhye', email: 'olivia@opensession.co', avatar: '' },
    usersOnPlan: 8,
    amount: '$10.00',
    date: 'Sep 1, 2025',
    status: 'paid',
  },
  {
    id: 'INV-001082025',
    admin: { name: 'Olivia Rhye', email: 'olivia@opensession.co', avatar: '' },
    usersOnPlan: 8,
    amount: '$10.00',
    date: 'Aug 1, 2025',
    status: 'paid',
  },
];

const COUNTRIES = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
];

function CardIcon({ type }: { type: string }) {
  const bgColors: Record<string, string> = {
    visa: 'bg-blue-600',
    mastercard: 'bg-orange-500',
    apple_pay: 'bg-black',
  };

  const labels: Record<string, string> = {
    visa: 'VISA',
    mastercard: 'MC',
    apple_pay: '🍎Pay',
  };

  return (
    <div className={`w-10 h-7 ${bgColors[type] || 'bg-gray-500'} rounded flex items-center justify-center`}>
      <span className="text-white text-xs font-bold">{labels[type] || '?'}</span>
    </div>
  );
}

export function BillingForm() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('1');
  const [billingEmail, setBillingEmail] = useState('billing@opensession.co');
  const [streetAddress, setStreetAddress] = useState('100 Smith Street');
  const [city, setCity] = useState('Collingwood');
  const [state, setState] = useState('VIC');
  const [postalCode, setPostalCode] = useState('3066');
  const [country, setCountry] = useState('AU');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Payment Method Section */}
      <section>
        <SettingsSectionHeader
          title="Payment method"
          description="Update your billing details and address."
        />

        {/* Card Details */}
        <SettingsField
          label="Card details"
          description="Select default payment method."
          required
        >
          <div className="space-y-3">
            {MOCK_PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`
                  flex items-center justify-between
                  p-4
                  bg-[var(--bg-primary)]
                  border rounded-xl
                  cursor-pointer
                  transition-all
                  ${selectedPaymentMethod === method.id
                    ? 'border-[var(--border-brand)] ring-1 ring-[var(--border-brand)]'
                    : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <CardIcon type={method.type} />
                  <div>
                    <p className="text-sm font-medium text-[var(--fg-primary)]">
                      {method.type === 'apple_pay' ? 'Apple Pay' : method.type.charAt(0).toUpperCase() + method.type.slice(1)} ending in {method.last4}
                    </p>
                    <p className="text-sm text-[var(--fg-tertiary)]">
                      Expiry {method.expiry}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <button className="text-sm font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)]">
                        Set as default
                      </button>
                      <button className="text-sm font-semibold text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selectedPaymentMethod === method.id}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-[var(--bg-brand-solid)] border-[var(--border-primary)]"
                />
              </label>
            ))}

            <button className="flex items-center gap-2 text-sm font-semibold text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors">
              <Plus className="w-4 h-4" />
              Add new payment method
            </button>
          </div>
        </SettingsField>

        {/* Email Address */}
        <SettingsField
          label="Email address"
          description="Invoices will be sent to this email address."
          required
        >
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-[var(--fg-quaternary)]" />
              </div>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="
                  w-full
                  pl-11 pr-3.5 py-2.5
                  bg-[var(--bg-primary)]
                  border border-[var(--border-primary)]
                  rounded-lg
                  text-[var(--fg-primary)] text-base
                  placeholder:text-[var(--fg-placeholder)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
                  shadow-xs
                "
              />
            </div>
            <button className="flex items-center gap-2 text-sm font-semibold text-[var(--fg-tertiary)] hover:text-[var(--fg-secondary)] transition-colors">
              <Plus className="w-4 h-4" />
              Add another
            </button>
          </div>
        </SettingsField>

        {/* Street Address */}
        <SettingsField label="Street address" required>
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Enter your street address"
            className="
              w-full
              px-3.5 py-2.5
              bg-[var(--bg-primary)]
              border border-[var(--border-primary)]
              rounded-lg
              text-[var(--fg-primary)] text-base
              placeholder:text-[var(--fg-placeholder)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
              shadow-xs
            "
          />
        </SettingsField>

        {/* City */}
        <SettingsField label="City" required>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter your city"
            className="
              w-full
              px-3.5 py-2.5
              bg-[var(--bg-primary)]
              border border-[var(--border-primary)]
              rounded-lg
              text-[var(--fg-primary)] text-base
              placeholder:text-[var(--fg-placeholder)]
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
              shadow-xs
            "
          />
        </SettingsField>

        {/* State / Province */}
        <SettingsField label="State / Province" required>
          <div className="flex gap-3">
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="
                w-24
                px-3.5 py-2.5
                bg-[var(--bg-primary)]
                border border-[var(--border-primary)]
                rounded-lg
                text-[var(--fg-primary)] text-base
                placeholder:text-[var(--fg-placeholder)]
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
                shadow-xs
              "
            />
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal code"
              className="
                w-24
                px-3.5 py-2.5
                bg-[var(--bg-primary)]
                border border-[var(--border-primary)]
                rounded-lg
                text-[var(--fg-primary)] text-base
                placeholder:text-[var(--fg-placeholder)]
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
                shadow-xs
              "
            />
          </div>
        </SettingsField>

        {/* Country */}
        <SettingsField label="Country" required>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="
                w-full
                appearance-none
                px-3.5 py-2.5 pr-10
                bg-[var(--bg-primary)]
                border border-[var(--border-primary)]
                rounded-lg
                text-[var(--fg-primary)] text-base
                focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--border-brand)]
                shadow-xs
                cursor-pointer
              "
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="w-5 h-5 text-[var(--fg-quaternary)]" />
            </div>
          </div>
        </SettingsField>

        <SettingsSectionFooter
          onCancel={() => {}}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </section>

      {/* Billing History Section */}
      <section className="pt-8 border-t border-[var(--border-secondary)]">
        <div className="flex items-start justify-between gap-4 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
              Billing history
            </h2>
            <p className="mt-0.5 text-sm text-[var(--fg-tertiary)]">
              Access all your previous invoices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="
              flex items-center gap-2
              px-4 py-2.5
              bg-[var(--bg-primary)]
              border border-[var(--border-primary)]
              rounded-lg
              text-sm font-semibold text-[var(--fg-secondary)]
              shadow-xs
              hover:bg-[var(--bg-primary-hover)]
              transition-colors
            ">
              <Download className="w-5 h-5" />
              Download all
            </button>
            <button className="p-2.5 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="border border-[var(--border-secondary)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-secondary-alt)] border-b border-[var(--border-secondary)]">
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[var(--border-primary)]"
                    />
                    <span className="text-xs font-medium text-[var(--fg-tertiary)]">Invoice</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                  Account admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                  Users on plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--fg-tertiary)]">
                  Status
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((invoice, index) => (
                <tr
                  key={invoice.id}
                  className={`
                    border-b border-[var(--border-secondary)]
                    ${index === MOCK_INVOICES.length - 1 ? 'border-b-0' : ''}
                  `}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--border-primary)]"
                      />
                      <span className="text-sm font-medium text-[var(--fg-primary)]">
                        {invoice.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[var(--fg-tertiary)]">
                          {invoice.admin.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--fg-primary)]">
                          {invoice.admin.name}
                        </p>
                        <p className="text-sm text-[var(--fg-tertiary)]">
                          {invoice.admin.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-[var(--bg-quaternary)] border-2 border-[var(--bg-primary)]"
                        />
                      ))}
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--bg-primary)] flex items-center justify-center">
                        <span className="text-[10px] font-medium text-[var(--fg-tertiary)]">
                          +{invoice.usersOnPlan - 4}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--fg-primary)]">
                    USD {invoice.amount}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--fg-primary)]">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="
                      inline-flex items-center gap-1
                      px-2 py-0.5
                      bg-[var(--bg-success-secondary)]
                      rounded-full
                      text-xs font-medium text-[var(--fg-success-primary)]
                    ">
                      <Check className="w-3 h-3" />
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-[var(--fg-quaternary)] hover:text-[var(--fg-tertiary)] transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

