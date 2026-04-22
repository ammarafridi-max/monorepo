"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What does TravelShield cover?",
    a: "TravelShield covers emergency medical expenses (up to $10M), trip cancellation and interruption, lost or delayed baggage, travel delays, personal liability, and more. Exact coverage depends on the plan you choose. You can compare all plans on our Plans page.",
  },
  {
    q: "When should I buy travel insurance?",
    a: "The sooner the better — ideally right after you book your trip. Buying early means you're covered for pre-departure events like illness or natural disasters that could force you to cancel before you even leave home.",
  },
  {
    q: "Does my policy cover pre-existing medical conditions?",
    a: "Some pre-existing conditions are covered automatically under our Comprehensive plan. Others may require a medical screening during the quote process. We'll always be upfront about what is and isn't included before you pay.",
  },
  {
    q: "How do I make a claim?",
    a: "You can file a claim online through your TravelShield account, or call our 24/7 emergency helpline. We'll assign you a dedicated claims handler and aim to resolve your claim within 72 hours of receiving all required documentation.",
  },
  {
    q: "Are adventure sports covered?",
    a: "Standard plans cover a range of low-risk activities. For higher-risk sports like skiing, scuba diving, bungee jumping, or mountaineering, you can add our Adventure Sports add-on at checkout for a small extra premium.",
  },
  {
    q: "Can I extend my policy if I decide to stay longer?",
    a: "Yes. As long as your policy hasn't expired and you haven't made a claim, you can extend your cover directly from your account dashboard. Extensions can be made for up to 12 months total trip duration.",
  },
  {
    q: "Is there a cooling-off period?",
    a: "Yes — you have 14 days from the date of purchase to cancel your policy for a full refund, provided your trip hasn't started and you haven't made a claim.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
      {faqs.map(({ q, a }, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 text-sm md:text-base">{q}</span>
              <ChevronDown
                size={18}
                className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5 bg-white">
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
