'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  AdFields,
  AudienceFields,
  Field,
  LocationPicker,
  adIsReady,
  audiencePayload,
  emptyAd,
  emptyAudience,
  fmtMoney,
  inputCls,
} from '../../components/admin/OpenAIAdsParts';
import { useOpenAIAdsSetup } from '../../hooks/openai-ads/useOpenAIAdsSetup';
import { useCreateOpenAICampaign } from '../../hooks/openai-ads/useOpenAIAdsMutations';

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {children}
    </div>
  );
}

export default function AdminOpenAIAdsNewCampaignPage({ basePath = '/admin/chatgpt-ads' }) {
  const router = useRouter();
  const { setup, isLoadingSetup, setupError } = useOpenAIAdsSetup();
  const { mutate: createCampaign, isPending } = useCreateOpenAICampaign();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('sales');
  const [locations, setLocations] = useState([]);
  const [dailyBudget, setDailyBudget] = useState('');
  const [audience, setAudience] = useState(emptyAudience());
  const [ad, setAd] = useState(emptyAd());

  useEffect(() => {
    if (setup?.website) setAd((prev) => (prev.targetUrl ? prev : { ...prev, targetUrl: setup.website }));
    if (setup && !setup.salesGoalAvailable) setGoal('clicks');
  }, [setup]);

  if (isLoadingSetup) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );
  }
  if (!setup) return <p className="text-sm text-red-600 text-center py-20">{setupError?.message || 'ChatGPT Ads is not set up.'}</p>;

  const currency = setup.currency ?? 'AED';
  const budget = Number(dailyBudget);
  const bid = Number(audience.bid);
  const problems = [
    name.trim().length < 3 && 'Give the campaign a name',
    !locations.length && 'Choose where to show it',
    !(budget > 0) && 'Set a daily budget',
    budget > setup.maxDailyBudget && `Daily budget can be at most ${fmtMoney(setup.maxDailyBudget, currency)}`,
    !(bid > 0) && (goal === 'sales' ? 'Set a target cost per order' : 'Set a max cost per click'),
    bid > budget && budget > 0 && 'The bid cannot be more than the daily budget',
    !adIsReady(ad) && 'Finish the ad (headline, text, link and image)',
  ].filter(Boolean);

  function submit() {
    createCampaign(
      {
        name,
        goal,
        dailyBudget: budget,
        locationIds: locations.map((l) => l.id),
        adGroup: { ...audiencePayload(audience), name: `${name.trim()} - main` },
        ad,
      },
      { onSuccess: (data) => router.push(`${basePath}/${data.id}`) },
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={basePath} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
          <ArrowLeft size={18} />
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900">New campaign</h2>
      </div>

      <Section title="1. Campaign">
        <Field label="Name" hint="Only you see this.">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="UAE Schengen visa travellers" />
        </Field>
        <Field label="Goal">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'sales', label: 'Get orders', sub: 'OpenAI finds people likely to buy', disabled: !setup.salesGoalAvailable },
              { value: 'clicks', label: 'Get clicks', sub: 'More visits to your site' },
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                disabled={g.disabled}
                onClick={() => setGoal(g.value)}
                className={`text-left p-3 rounded-xl border transition disabled:opacity-40 ${
                  goal === g.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{g.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.sub}</p>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Where to show it">
          <LocationPicker value={locations} onChange={setLocations} />
        </Field>
        <Field label={`Daily budget (${currency})`} hint={`Up to ${fmtMoney(setup.maxDailyBudget, currency)} a day.`}>
          <input type="number" min="1" max={setup.maxDailyBudget} className={inputCls} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
        </Field>
      </Section>

      <Section title="2. Audience">
        <AudienceFields audience={audience} onChange={setAudience} goal={goal} currency={currency} />
      </Section>

      <Section title="3. Ad">
        <AdFields ad={ad} onChange={setAd} />
      </Section>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
        {problems.length ? (
          <ul className="text-sm text-gray-500 list-disc pl-5 space-y-0.5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700">
            This creates <span className="font-semibold">{name.trim()}</span>, aiming for {goal === 'sales' ? 'orders' : 'clicks'} in{' '}
            {locations.map((l) => l.name).join(', ')}, up to {fmtMoney(budget, currency)} a day. It starts paused, so nothing runs
            until you turn it on.
          </p>
        )}
        <button
          onClick={submit}
          disabled={problems.length > 0 || isPending}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-50"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Create campaign (paused)
        </button>
      </div>
    </div>
  );
}
