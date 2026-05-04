

import mongoose from 'mongoose';
import VisaSchema from '@travel-suite/visa/schema';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set. Did you run with --env-file?');
  process.exit(1);
}

const SCHENGEN = {
  countryName: 'Schengen Area',
  slug: 'schengen',
  status: 'published',
  publishedAt: new Date(),

  heroHeadline:    'Schengen Visa From UAE — Fast Approval, Zero Surprises',
  heroSubheadline: 'Most rejections are caused by preventable document errors. Our specialists review every file before submission so yours doesn\'t become a statistic.',
  heroCtaText:     'Get free consultation',
  heroImageUrl:    '',

  qualifierItems: [
    'You\'re a UAE resident applying for your first Schengen visa',
    'You\'ve been rejected before and want to understand exactly why',
    'You\'re travelling soon and need Express processing',
    'You want an expert to handle your file completely end-to-end',
  ],

  packages: [
    {
      name:          'Standard',
      price:         499,
      currency:      'AED',
      timeline:      '7–10 business days',
      description:   'Document review and complete file preparation for standard Schengen applications.',
      isHighlighted: false,
      icon:          'FileText',
      features: [
        'GDS flight reservation included',
        'Hotel booking confirmation',
        'Travel insurance document',
        'Day-by-day itinerary planning',
        'Full document checklist and review',
        'Cover letter template and guidance',
      ],
      exclusions: [
        'Schengen embassy fee (AED ~340) not included',
        'VFS appointment fee (AED ~95) not included',
      ],
    },
    {
      name:          'Express',
      price:         899,
      currency:      'AED',
      timeline:      '3–5 business days',
      description:   'Priority processing with a dedicated specialist and VFS appointment booking.',
      isHighlighted: true,
      icon:          'Zap',
      features: [
        'Everything in Standard',
        'Priority specialist assignment',
        'VFS appointment booking handled by Travl',
        '24-hour WhatsApp support during processing',
        'File reviewed by senior Schengen specialist',
        'Same-day document dispatch once complete',
      ],
      exclusions: [
        'Schengen embassy fee (AED ~340) not included',
      ],
    },
    {
      name:          'Concierge',
      price:         1799,
      currency:      'AED',
      timeline:      '1–3 business days',
      description:   'Full white-glove service — every fee included, every step managed from your doorstep.',
      isHighlighted: false,
      icon:          'Crown',
      features: [
        'Everything in Express',
        'Schengen embassy fee included',
        'VFS service and biometric fees included',
        'Home or office document collection in Dubai',
        'Dedicated relationship manager throughout',
        'Free resubmission with revised file if refused',
      ],
      exclusions: [],
    },
  ],

  processSteps: [
    {
      title:       'Complete our form',
      description: 'Fill in your travel details online in under 5 minutes — dates, countries, and document uploads. No office visit needed at this stage.',
      icon:        'ClipboardList',
    },
    {
      title:       'Specialist review',
      description: 'A dedicated Schengen specialist checks your profile against current embassy requirements and flags any gaps before we proceed.',
      icon:        'UserCheck',
    },
    {
      title:       'Document preparation',
      description: 'We prepare your full application file: cover letter, financial summary, itinerary, accommodation proof, and all supporting documents.',
      icon:        'FileSearch',
    },
    {
      title:       'VFS appointment',
      description: 'We book your VFS appointment (or guide you through self-booking) and brief you on exactly what to bring and what to expect.',
      icon:        'Calendar',
    },
    {
      title:       'Track until your passport returns',
      description: 'We monitor your application and notify you the moment a decision is made. Any embassy queries that arise — we handle them.',
      icon:        'Package',
    },
  ],

  requirementSections: [
    {
      title: 'Personal Documents',
      intro: 'These are mandatory for every Schengen applicant regardless of nationality or destination country.',
      items: [
        'Valid passport (minimum 3 months validity beyond travel date, at least 2 blank pages)',
        'Two recent passport-sized photos (white background, 35mm × 45mm)',
        'Emirates ID — front and back copy',
        'UAE Residence Visa copy',
        'Completed Schengen visa application form (we prepare this)',
      ],
    },
    {
      title: 'Financial Documents',
      intro: 'Embassies must be satisfied that you can fund your trip independently and have strong reasons to return to the UAE.',
      items: [
        'Bank statements for the last 3 months (bank-stamped original)',
        'Salary certificate on company letterhead confirming position and salary',
        'No Objection Certificate (NOC) from employer confirming approved leave',
        'Last 3 months payslips (if employed)',
        'Trade licence copy (if self-employed)',
        'Audited accounts or tax returns (if self-employed)',
      ],
    },
    {
      title: 'Travel Documents',
      intro: 'Required for all applicants to demonstrate a confirmed travel plan. Travl provides the flight reservation and hotel booking.',
      items: [
        'GDS flight reservation / itinerary (we provide this — accepted by all Schengen embassies)',
        'Hotel booking confirmation for every night of the stay',
        'Travel insurance with minimum EUR 30,000 cover, valid across all Schengen member states',
        'Day-by-day travel itinerary',
        'Proof of accommodation if staying with friends or family (invitation letter)',
      ],
    },
  ],

  pricingBreakdown: [
    { item: 'Travl service fee',         amount: 499,  currency: 'AED', paidTo: 'Travl',   note: 'Standard package shown; Express AED 899, Concierge AED 1,799'              },
    { item: 'Schengen embassy visa fee', amount: 340,  currency: 'AED', paidTo: 'Embassy', note: 'Approx. AED 340 (EUR 80); rate depends on AED/EUR exchange on day of payment' },
    { item: 'VFS global service charge', amount: 95,   currency: 'AED', paidTo: 'VFS',    note: 'Subject to VFS fee schedule; may change without notice'                      },
    { item: 'Biometric enrolment fee',   amount: 70,   currency: 'AED', paidTo: 'VFS',    note: 'First-time applicants only; waived on renewals within 59 months'              },
  ],

  whyUs: [
    {
      title:       'Native-language support',
      description: 'Our team speaks Arabic, Urdu, Hindi, and English. You get guidance in the language you\'re most comfortable in — no misunderstandings, no gaps.',
      icon:        'Users',
    },
    {
      title:       '3-minute response time',
      description: 'Send us a WhatsApp or email and expect a response within 3 minutes during business hours, and within an hour outside them.',
      icon:        'Clock',
    },
    {
      title:       'Licensed Dubai office',
      description: 'We operate from a DAFZ-licensed office in Dubai. Walk in any working day for a face-to-face consultation — no appointment needed.',
      icon:        'MapPin',
    },
    {
      title:       'Transparent pricing',
      description: 'No hidden fees. The price you see covers exactly what\'s described. Embassy and VFS fees are passed through at cost, never marked up.',
      icon:        'Eye',
    },
  ],

  testimonials: [
    {
      name:        'Anjali R.',
      nationality: 'Indian',
      visaType:    'Schengen visa',
      quote:       'I was so worried after reading horror stories about Schengen rejections. Travl reviewed every single document and caught two errors in my bank statements before submission. Approved in 9 days for our Italy trip.',
      rating:      5,
      initials:    'AR',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Mohammed Al-Farsi',
      nationality: 'Emirati',
      visaType:    'Schengen visa',
      quote:       'Second application — first one was rejected by another agent. Travl identified the exact problem with my previous file and fixed it. Got a 2-year multiple-entry Schengen on the reapplication.',
      rating:      5,
      initials:    'MA',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Maria Santos',
      nationality: 'Filipino',
      visaType:    'Schengen visa',
      quote:       'As an OFW I was nervous about the financials. The team explained everything clearly, helped me structure the bank statement letter, and handled the VFS appointment booking. Spain trip was a dream.',
      rating:      5,
      initials:    'MS',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Tariq Mahmoud',
      nationality: 'Egyptian',
      visaType:    'Schengen Express',
      quote:       'Used the Express service — needed the visa in under a week. Travl delivered. The WhatsApp support was genuinely real-time. Will use again for my next trip.',
      rating:      5,
      initials:    'TM',
      imageUrl:    '',
      isFeatured:  false,
    },
  ],

  faqs: [
    {
      question: 'What is the Schengen visa approval rate for UAE residents?',
      answer:   'UAE residents typically see an 85–90% approval rate for Schengen visas when their files are complete and correctly prepared. The most common rejections are administrative — wrong photo dimensions, inconsistent bank statements, or missing employer letters. A well-prepared file dramatically reduces refusal risk.',
    },
    {
      question: 'How long does Schengen visa processing take from the UAE?',
      answer:   'Standard processing is 15 calendar days from your VFS appointment date. Our Express service targets 3–5 business days, and Concierge targets 1–3 business days. Processing can extend during peak travel periods: July–August, Christmas, and Eid holidays.',
    },
    {
      question: 'I was rejected before. Can you still help me?',
      answer:   'Yes — this is one of our most common cases. We start by reviewing your previous rejection notice to identify the specific grounds. Most rejections are fixable with a stronger financial narrative, a more detailed cover letter, or corrected documents. We have a high success rate on second applications when the first was professionally reanalysed.',
    },
    {
      question: 'Do I need to submit original documents or copies?',
      answer:   'Most Schengen embassies require colour printed copies alongside originals for verification at the VFS counter. Bank statements must be bank-stamped. Your original passport is submitted to VFS and returned with your visa decision. Travl will give you a precise checklist for your specific embassy.',
    },
    {
      question: 'Is a GDS flight reservation accepted by Schengen embassies and VFS?',
      answer:   'Yes. All Schengen embassies and VFS centres accept flight reservations (also called itineraries or dummy tickets) that are verifiable on the airline\'s system. Travl\'s reservations are GDS-based, hold a real booking reference, and can be looked up on the airline\'s website — they are specifically designed and widely accepted for visa applications.',
    },
    {
      question: 'Can I visit multiple Schengen countries on one visa?',
      answer:   'A standard Schengen visa allows free movement across all 27 Schengen member states during its validity period. You apply through the embassy of your main destination (the country where you spend the most nights). If your itinerary is equally split, apply through your first port of entry.',
    },
    {
      question: 'What happens if my visa is refused after I pay your fee?',
      answer:   'Embassy and VFS fees are non-refundable for any applicant, through any provider — this is set by the embassy, not Travl. Our Concierge package includes a free resubmission with a revised file. Standard and Express clients receive a detailed refusal analysis with specific recommendations for a stronger reapplication.',
    },
    {
      question: 'Can you help with urgent applications — travel in under 2 weeks?',
      answer:   'Yes — contact us immediately via WhatsApp. Some embassies offer urgent appointment slots, and we have experience expediting files for clients with imminent travel dates. Success depends on embassy capacity and your profile. We\'ll give you an honest assessment within minutes of you reaching out.',
    },
  ],

  finalCtaHeadline: 'Ready to start your Schengen application?',
  finalCtaText:     'Get free consultation',
  metaTitle:        'Schengen Visa from UAE | Travl Visa Assistance',
  metaDescription:  'Expert Schengen visa assistance for UAE residents. Document review, VFS appointment booking & full file preparation. From AED 499. Get started today.',
};

const UK = {
  countryName: 'United Kingdom',
  slug: 'united-kingdom',
  status: 'published',
  publishedAt: new Date(),

  heroHeadline:    'UK Visa from UAE — Expert Guidance, No Guesswork',
  heroSubheadline: 'UK visa refusals have risen sharply. Avoid the most common mistakes with a specialist who knows exactly what the Home Office expects.',
  heroCtaText:     'Get free consultation',
  heroImageUrl:    '',

  qualifierItems: [
    'You\'re a UAE resident planning a trip, transit, or family visit to the UK',
    'You\'ve received a UK visa refusal and need to understand your refusal notice',
    'You want professional document preparation for a complex application profile',
    'You\'re travelling for business, tourism, or to visit family in the United Kingdom',
  ],

  packages: [
    {
      name:          'Standard',
      price:         699,
      currency:      'AED',
      timeline:      '10–15 business days',
      description:   'Document review and file preparation for standard UK Standard Visitor visa applications.',
      isHighlighted: false,
      icon:          'FileText',
      features: [
        'GDS flight reservation included',
        'Hotel booking confirmation',
        'UK-specific cover letter addressing Home Office criteria',
        'Document checklist and thorough review',
        'Travel itinerary planning',
        'Financial evidence guidance',
      ],
      exclusions: [
        'UK visa application fee (AED ~550) not included',
        'Visa Application Centre service fee (AED ~165) not included',
      ],
    },
    {
      name:          'Express',
      price:         1299,
      currency:      'AED',
      timeline:      '5–8 business days',
      description:   'Priority file preparation with VAC appointment support and senior specialist review.',
      isHighlighted: true,
      icon:          'Zap',
      features: [
        'Everything in Standard',
        'Priority specialist assignment',
        'VAC appointment booking handled by Travl',
        'Daily application status updates',
        'Senior specialist file review',
        'Financial summary document preparation',
      ],
      exclusions: [
        'UK government visa fee (AED ~550) not included',
      ],
    },
    {
      name:          'Concierge',
      price:         2499,
      currency:      'AED',
      timeline:      '3–5 business days',
      description:   'Full-service management including all government fees and home document collection.',
      isHighlighted: false,
      icon:          'Crown',
      features: [
        'Everything in Express',
        'UK Standard Visitor Visa fee included',
        'VAC service fee included',
        'Home or office document collection across Dubai',
        'Dedicated relationship manager throughout',
        'Free resubmission if refused on document grounds',
      ],
      exclusions: [],
    },
  ],

  processSteps: [
    {
      title:       'Consultation and profile review',
      description: 'We assess your travel history, employment stability, financials, and any previous refusals to identify the strongest approach before we write a single word.',
      icon:        'ClipboardList',
    },
    {
      title:       'Document and cover letter preparation',
      description: 'We prepare your full UK visa package — a cover letter that directly addresses Home Office decision-making criteria, financial summary, accommodation proof, and itinerary.',
      icon:        'FileSearch',
    },
    {
      title:       'Online application form completion',
      description: 'We complete your UK Visas and Immigration online application on your behalf, verifying every field before submission to eliminate form errors.',
      icon:        'UserCheck',
    },
    {
      title:       'Biometric appointment at the VAC',
      description: 'We book your UKVI Visa Application Centre appointment in Dubai and brief you precisely on what to bring and what to expect on the day.',
      icon:        'Calendar',
    },
    {
      title:       'Monitoring and passport return',
      description: 'We track your application and notify you the moment a decision is made. Your passport is returned to the VAC for collection — we alert you the moment it\'s ready.',
      icon:        'Package',
    },
  ],

  requirementSections: [
    {
      title: 'Identity and Residency',
      intro: 'The UK Home Office requires clear proof of who you are and your legal right to be in the UAE.',
      items: [
        'Valid passport (minimum 6 months validity beyond your intended return date)',
        'All previous passports showing full travel history',
        'Emirates ID — front and back copy',
        'UAE Residence Visa copy',
        'Two recent passport-sized photographs (white or off-white background)',
      ],
    },
    {
      title: 'Financial Evidence',
      intro: 'Insufficient financial evidence is the leading cause of UK visa refusals. Your finances must clearly demonstrate affordability and strong ties that ensure your return.',
      items: [
        'Personal bank statements for the last 6 months (bank-stamped original)',
        'Salary certificate confirming employment, role, salary, and approved leave',
        'Last 3 months payslips',
        'No Objection Certificate from employer on company letterhead',
        'Employment contract (if less than 2 years at current employer)',
        'Business registration documents and audited accounts (if self-employed)',
      ],
    },
    {
      title: 'Travel and Accommodation',
      intro: 'Required to demonstrate a clear, credible purpose of travel and planned itinerary.',
      items: [
        'Flight itinerary / reservation (we provide this — accepted by UK Home Office)',
        'Hotel booking confirmation or invitation letter from UK host',
        'Day-by-day travel itinerary for the duration of your stay',
        'Travel insurance covering the United Kingdom',
        'Proof of previous international travel (stamps and visas in old passports)',
      ],
    },
  ],

  pricingBreakdown: [
    { item: 'Travl service fee',            amount: 699,  currency: 'AED', paidTo: 'Travl',           note: 'Standard package; Concierge includes all government fees'         },
    { item: 'UK Standard Visitor Visa fee', amount: 550,  currency: 'AED', paidTo: 'UK Home Office',  note: 'Approx. AED 550 (GBP 115); subject to UK government fee changes'   },
    { item: 'UKVI Visa Application Centre', amount: 165,  currency: 'AED', paidTo: 'TLScontact',      note: 'Dubai VAC service charge; may vary'                                },
    { item: 'Priority visa service (opt.)', amount: 1200, currency: 'AED', paidTo: 'UK Home Office',  note: 'Optional: reduces 15-day processing to 5 business days'            },
  ],

  whyUs: [
    {
      title:       'UK refusal analysis',
      description: 'We read and decode Home Office refusal notices and build a stronger, targeted case for reapplication — addressing every stated concern directly.',
      icon:        'FileSearch',
    },
    {
      title:       'Bilingual specialist team',
      description: 'Our consultants communicate fluently in Arabic and English. No misunderstandings, no lost-in-translation errors in your cover letter or supporting documents.',
      icon:        'Users',
    },
    {
      title:       'End-to-end management',
      description: 'From your first document upload to the day your passport is returned, we manage every step — you don\'t chase paperwork, embassies, or appointment systems.',
      icon:        'Package',
    },
    {
      title:       'No hidden fees',
      description: 'Our pricing is fixed and fully transparent. We tell you upfront exactly what you pay Travl and exactly what you pay the UK government — nothing more.',
      icon:        'Eye',
    },
  ],

  testimonials: [
    {
      name:        'Priya Nair',
      nationality: 'Indian',
      visaType:    'UK Standard Visitor',
      quote:       'Got refused once before coming to Travl. They read through my refusal notice line by line and restructured my entire application. Approved second time with a 2-year multiple entry visa.',
      rating:      5,
      initials:    'PN',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Ahmed Hassan',
      nationality: 'Egyptian',
      visaType:    'UK Standard Visitor',
      quote:       'The cover letter they wrote was genuinely impressive — specific, structured, and addressed every concern the Home Office typically raises. Visa approved in 11 working days.',
      rating:      5,
      initials:    'AH',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Rowena Cruz',
      nationality: 'Filipino',
      visaType:    'UK Standard Visitor',
      quote:       'Travl handled everything from the VAC appointment to the financial summary document. I just showed up, submitted my biometrics, and got the visa. Simple and stress-free.',
      rating:      5,
      initials:    'RC',
      imageUrl:    '',
      isFeatured:  true,
    },
  ],

  faqs: [
    {
      question: 'How long does a UK Standard Visitor Visa take from the UAE?',
      answer:   'The UK Home Office standard processing time is 15 business days from your biometric appointment at the Visa Application Centre. Priority processing (approximately AED 1,200) reduces this to 5 business days. Our Concierge package includes the UK visa fee and priority service for the fastest possible turnaround.',
    },
    {
      question: 'Why are UK visa refusals so common for UAE residents?',
      answer:   'The UK has significantly tightened its scrutiny of applications in recent years. Common refusal reasons include insufficient financial evidence (less than 6 months of bank statements), unclear purpose of travel, weak ties to the UAE, and inconsistent or missing documents. Our specialists know exactly what Home Office caseworkers look for.',
    },
    {
      question: 'Do I need to attend a Visa Application Centre appointment in person?',
      answer:   'Yes. All UK visa applicants must attend a UKVI Visa Application Centre in Dubai to submit biometric data (fingerprints and photograph). You cannot submit a UK visa application entirely online. Travl will book your appointment and brief you thoroughly on what to bring and what to expect.',
    },
    {
      question: 'Can I appeal if my UK visa is refused?',
      answer:   'In most cases, Standard Visitor Visa refusals carry no formal right of appeal. However, you can reapply immediately with a stronger file that directly addresses the stated refusal reasons. This is why a professional analysis of the refusal notice is critical — our Concierge package includes a free resubmission.',
    },
    {
      question: 'How much money do I need in my bank account for a UK visa?',
      answer:   'There is no fixed minimum — the Home Office assesses affordability relative to your planned expenses and length of stay. As a general guide, UAE applicants travelling for 2 weeks should show at least AED 10,000–15,000 maintained consistently over 3–6 months. Large, irregular lump-sum deposits are a red flag for caseworkers.',
    },
    {
      question: 'Is a GDS flight reservation accepted by the UK Home Office?',
      answer:   'Yes. The UK Home Office explicitly accepts flight itineraries and reservations as part of visa applications — applicants are not expected to hold confirmed, paid-for tickets before a visa is issued. Our GDS-based reservations carry a verifiable booking reference and are accepted for UK visa applications.',
    },
    {
      question: 'Can I include my family members on one application?',
      answer:   'No — each applicant must submit a separate application and pay a separate UK government fee. However, Travl can prepare a coordinated family application ensuring all files are consistent and no application contradicts another.',
    },
  ],

  finalCtaHeadline: 'Ready to apply for your UK visa?',
  finalCtaText:     'Get free consultation',
  metaTitle:        'UK Visa from UAE | Travl Visa Assistance',
  metaDescription:  'Expert UK Standard Visitor Visa assistance for UAE residents. Home Office-compliant file preparation, VAC appointment support. From AED 699.',
};

const USA = {
  countryName: 'United States',
  slug: 'usa',
  status: 'published',
  publishedAt: new Date(),

  heroHeadline:    'US Visa from UAE — Interview Preparation That Gets Approvals',
  heroSubheadline: 'The US B1/B2 visa interview is where most applications succeed or fail. Our specialists prepare you thoroughly so you walk in confident and walk out with your visa.',
  heroCtaText:     'Get free consultation',
  heroImageUrl:    '',

  qualifierItems: [
    'You\'re a UAE resident applying for a US tourist or business visa (B1/B2)',
    'You have a US visa interview coming up and want expert preparation',
    'You\'ve been refused before and need to understand what went wrong',
    'You want your DS-160 form, documents, and interview answers professionally prepared',
  ],

  packages: [
    {
      name:          'Standard',
      price:         799,
      currency:      'AED',
      timeline:      '7–12 business days',
      description:   'Complete DS-160 preparation, document review, and interview briefing for US B1/B2 visa applications.',
      isHighlighted: false,
      icon:          'FileText',
      features: [
        'DS-160 application form completed on your behalf',
        'Document checklist and thorough review',
        'Cover letter explaining purpose of travel',
        'Flight itinerary for the interview',
        'Interview Q&A preparation guide',
        'Financial evidence review and guidance',
      ],
      exclusions: [
        'US MRV visa application fee (AED ~680) not included',
        'USCIS Immigrant Fee does not apply to B1/B2',
      ],
    },
    {
      name:          'Express',
      price:         1499,
      currency:      'AED',
      timeline:      '3–5 business days',
      description:   'Priority preparation with a live mock interview session and dedicated specialist support.',
      isHighlighted: true,
      icon:          'Zap',
      features: [
        'Everything in Standard',
        'Live mock interview session (30 minutes via video call)',
        'Personalised interview answer coaching',
        'Priority specialist assignment',
        'WhatsApp support throughout the process',
        'Post-interview follow-up and next-step guidance',
      ],
      exclusions: [
        'US MRV visa application fee (AED ~680) not included',
      ],
    },
    {
      name:          'Concierge',
      price:         2799,
      currency:      'AED',
      timeline:      '1–3 business days',
      description:   'End-to-end management including MRV fee, appointment scheduling, and unlimited interview coaching.',
      isHighlighted: false,
      icon:          'Crown',
      features: [
        'Everything in Express',
        'US MRV application fee included',
        'Embassy appointment scheduling managed by Travl',
        'Unlimited WhatsApp support until visa decision',
        'Two live mock interview sessions',
        'Free reapplication support if refused',
      ],
      exclusions: [],
    },
  ],

  processSteps: [
    {
      title:       'Profile review and strategy',
      description: 'We assess your travel history, ties to the UAE, employment, and financial standing to determine the strongest approach and identify any risk factors before starting.',
      icon:        'ClipboardList',
    },
    {
      title:       'DS-160 form completion',
      description: 'We complete your DS-160 online application form in full, cross-checking every field against your documents to eliminate inconsistencies that trigger refusals.',
      icon:        'FileSearch',
    },
    {
      title:       'Document preparation',
      description: 'We prepare your supporting file: financial evidence, employment documents, cover letter, flight itinerary, and any additional documents specific to your profile.',
      icon:        'UserCheck',
    },
    {
      title:       'Interview preparation',
      description: 'We run a structured mock interview and coach you on how to answer consular questions clearly, confidently, and consistently with your documents.',
      icon:        'MessageCircle',
    },
    {
      title:       'Embassy appointment',
      description: 'You attend the US Embassy or Consulate in Abu Dhabi or Dubai for your interview. We brief you on exactly what to bring, what to expect, and how to present yourself.',
      icon:        'Calendar',
    },
  ],

  requirementSections: [
    {
      title: 'Identity and UAE Residency',
      intro: 'All US visa applicants must prove their identity and their legal right to reside in the UAE.',
      items: [
        'Valid passport (minimum 6 months validity beyond your intended stay)',
        'Previous passports showing travel history (US consular officers review this carefully)',
        'Emirates ID — front and back copy',
        'UAE Residence Visa copy',
        'One recent passport-sized photograph (white background, specific US specifications)',
      ],
    },
    {
      title: 'Financial and Employment Documents',
      intro: 'The consular officer must be satisfied that you have the financial means to travel and strong ties to the UAE that guarantee your return.',
      items: [
        'Bank statements for the last 3–6 months (showing regular salary credits and healthy balance)',
        'Salary certificate confirming your position, employer, and monthly salary',
        'No Objection Certificate from employer confirming approved leave and intent to return',
        'Last 3 months payslips',
        'Company trade licence (if self-employed)',
        'Evidence of assets, property, or investments in the UAE or home country (strengthens ties)',
      ],
    },
    {
      title: 'Travel and Purpose Documents',
      intro: 'You must demonstrate a clear, credible travel purpose and a confirmed plan to return to the UAE after your visit.',
      items: [
        'Flight itinerary (we provide this — accepted by US consular officers)',
        'Hotel booking confirmation or invitation letter from a US host',
        'Detailed travel itinerary explaining what you plan to do in the US',
        'For business applicants: invitation letter from US company on company letterhead',
        'Evidence of family ties, property ownership, or employment obligations in the UAE',
      ],
    },
  ],

  pricingBreakdown: [
    { item: 'Travl service fee',       amount: 799,  currency: 'AED', paidTo: 'Travl',      note: 'Standard package; Concierge includes US MRV fee'                              },
    { item: 'US MRV application fee',  amount: 680,  currency: 'AED', paidTo: 'US Embassy', note: 'Approx. AED 680 (USD 185); non-refundable regardless of outcome'              },
    { item: 'SEVIS fee (if student)',  amount: 440,  currency: 'AED', paidTo: 'US Govt.',   note: 'Only applies to F/M/J visa categories — not required for B1/B2 tourist visa'   },
  ],

  whyUs: [
    {
      title:       'Interview coaching that works',
      description: 'Our mock interview sessions are structured around real consular questions. We coach you to answer confidently, consistently, and in a way that matches your documents perfectly.',
      icon:        'MessageCircle',
    },
    {
      title:       'DS-160 expertise',
      description: 'The DS-160 is longer and more detailed than any other visa form. A single inconsistency can trigger a refusal. We complete it in full and verify every field against your supporting documents.',
      icon:        'FileSearch',
    },
    {
      title:       'Refusal analysis and reapplication',
      description: 'If you\'ve been refused before, we analyse your case and identify exactly why. Most refusals are recoverable with a stronger application and better interview preparation.',
      icon:        'RefreshCw',
    },
    {
      title:       'Arabic and English support',
      description: 'Our consultants work in Arabic and English — useful especially for translating financial documents, preparing Arabic-speaking clients for English-language interviews, and reviewing sponsor letters.',
      icon:        'Users',
    },
  ],

  testimonials: [
    {
      name:        'Khalid Al-Rashidi',
      nationality: 'Emirati',
      visaType:    'US B1/B2 Visa',
      quote:       'I had no idea how to handle the DS-160 or what questions they\'d ask at the embassy. Travl prepared everything and ran a mock interview that was almost exactly like the real one. Visa approved first time.',
      rating:      5,
      initials:    'KR',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Sunita Menon',
      nationality: 'Indian',
      visaType:    'US B2 Tourist Visa',
      quote:       'Was refused once before I found Travl. They explained exactly what the consular officer would have flagged in my previous application and rebuilt the whole file. Got my 10-year visa on the reapplication.',
      rating:      5,
      initials:    'SM',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'James Okonkwo',
      nationality: 'Nigerian',
      visaType:    'US B1 Business Visa',
      quote:       'The mock interview session was incredibly helpful. I walked into the actual interview calm because I\'d already answered every question the night before. Straightforward approval.',
      rating:      5,
      initials:    'JO',
      imageUrl:    '',
      isFeatured:  true,
    },
  ],

  faqs: [
    {
      question: 'How long does it take to get a US visa from the UAE?',
      answer:   'Processing time depends on interview appointment availability at the US Embassy in Abu Dhabi or the Consulate in Dubai. Wait times for interview appointments currently range from a few weeks to several months depending on demand. Once your interview is complete, most decisions are made within 3–5 business days. Administrative processing (221g) can extend this.',
    },
    {
      question: 'What is the DS-160 and why is it so important?',
      answer:   'The DS-160 is the mandatory online application form for all US non-immigrant visas. It is significantly longer and more detailed than other visa applications — covering your full employment history, travel history, family background, and the purpose of your visit in detail. Every answer is verified against your documents by the consular officer during the interview. Inconsistencies are a leading cause of refusal.',
    },
    {
      question: 'Do I need to attend an interview for a US visa?',
      answer:   'Yes. In almost all cases, applicants aged 14–79 must attend a personal interview at the US Embassy in Abu Dhabi or the US Consulate General in Dubai. Travl will prepare you thoroughly for this interview so you know exactly what to expect and how to answer.',
    },
    {
      question: 'What are the most common reasons for US visa refusals from the UAE?',
      answer:   'The most common refusal ground is Section 214(b) — the consular officer was not satisfied that the applicant has sufficient ties to their home country or the UAE to guarantee their return. Other common causes include weak financial evidence, an unclear travel purpose, inconsistencies between the DS-160 and supporting documents, and poor interview performance.',
    },
    {
      question: 'Can I reapply after a US visa refusal?',
      answer:   'Yes. There is no mandatory waiting period after a B1/B2 refusal — you can reapply immediately. However, simply reapplying with the same file will almost certainly result in the same outcome. You must present materially different evidence or circumstances. Travl provides a detailed refusal analysis and restructures your entire application before any reapplication.',
    },
    {
      question: 'Is a GDS flight reservation accepted for a US visa interview?',
      answer:   'Yes. Consular officers accept flight itineraries and reservations as evidence of intended travel for US visa applications. You are not expected to hold confirmed paid-for tickets before a visa is granted. Our GDS-based reservations carry a verifiable booking reference and are appropriate for US visa interviews.',
    },
    {
      question: 'How much does the US visa application cost?',
      answer:   'The US government MRV fee is USD 185 (approximately AED 680) and is non-refundable regardless of whether your application is approved or refused. This is paid separately and directly to the US Embassy. Our service fee covers preparation, coaching, and support — it is separate from the government fee.',
    },
  ],

  finalCtaHeadline: 'Ready to apply for your US visa?',
  finalCtaText:     'Get free consultation',
  metaTitle:        'US Visa from UAE | B1/B2 Visa Assistance | Travl',
  metaDescription:  'Expert US B1/B2 visa assistance for UAE residents. DS-160 preparation, interview coaching & full file preparation. From AED 799. Get started today.',
};

const CANADA = {
  countryName: 'Canada',
  slug: 'canada',
  status: 'published',
  publishedAt: new Date(),

  heroHeadline:    'Canada Visa from UAE — Strong Applications, Faster Decisions',
  heroSubheadline: 'Canada\'s IRCC reviews applications closely for financial ties, travel history, and intent to return. Our specialists make sure every element of your file is airtight.',
  heroCtaText:     'Get free consultation',
  heroImageUrl:    '',

  qualifierItems: [
    'You\'re a UAE resident applying for a Canada Visitor Visa (TRV)',
    'You\'ve been refused and need to understand why your application was rejected',
    'You want a specialist to handle your IRCC online application and supporting documents',
    'You\'re travelling for tourism, family, or business and need a strong, complete file',
  ],

  packages: [
    {
      name:          'Standard',
      price:         699,
      currency:      'AED',
      timeline:      '10–15 business days',
      description:   'Complete IRCC application preparation and document review for Canada Visitor Visa applications.',
      isHighlighted: false,
      icon:          'FileText',
      features: [
        'IRCC online application completed on your behalf',
        'Document checklist and thorough review',
        'Cover letter explaining purpose of visit',
        'Flight itinerary for your application',
        'Financial evidence review and structuring',
        'Guidance on ties to UAE and home country',
      ],
      exclusions: [
        'Canada visa application fee (AED ~270) not included',
        'Biometrics fee (AED ~230) not included',
      ],
    },
    {
      name:          'Express',
      price:         1199,
      currency:      'AED',
      timeline:      '5–8 business days',
      description:   'Priority preparation with dedicated specialist, biometrics scheduling, and daily status updates.',
      isHighlighted: true,
      icon:          'Zap',
      features: [
        'Everything in Standard',
        'Priority specialist assignment',
        'Biometrics appointment booking at VFS Canada',
        'Daily application status updates',
        'Senior specialist file review',
        'Personalised cover letter addressing refusal history (if applicable)',
      ],
      exclusions: [
        'Canada visa application fee (AED ~270) not included',
        'Biometrics fee (AED ~230) not included',
      ],
    },
    {
      name:          'Concierge',
      price:         2299,
      currency:      'AED',
      timeline:      '3–5 business days',
      description:   'All-inclusive service with government fees covered and dedicated management from start to finish.',
      isHighlighted: false,
      icon:          'Crown',
      features: [
        'Everything in Express',
        'Canada visa application fee included',
        'Biometrics fee included',
        'Home or office document collection in Dubai',
        'Dedicated relationship manager throughout',
        'Free reapplication support if refused',
      ],
      exclusions: [],
    },
  ],

  processSteps: [
    {
      title:       'Profile review and eligibility check',
      description: 'We assess your travel history, employment status, financial standing, and any previous Canada refusals to identify the strongest presentation for your application.',
      icon:        'ClipboardList',
    },
    {
      title:       'IRCC application and document preparation',
      description: 'We complete your Canada Visitor Visa online application on IRCC\'s platform and prepare your full supporting document package, including a cover letter tailored to your profile.',
      icon:        'FileSearch',
    },
    {
      title:       'Biometrics at VFS Canada',
      description: 'Most applicants are required to provide biometric data at a VFS Canada centre in Dubai or Abu Dhabi. We book your appointment and prepare you for the visit.',
      icon:        'UserCheck',
    },
    {
      title:       'Application submission and monitoring',
      description: 'We submit your complete application to IRCC and track its progress through the portal. You are notified immediately at every stage — acknowledgement, biometrics request, decision.',
      icon:        'Package',
    },
    {
      title:       'Passport stamping and collection',
      description: 'Once approved, your passport is returned to the VFS centre for visa stamping and collection. We alert you the moment it\'s ready to pick up.',
      icon:        'Calendar',
    },
  ],

  requirementSections: [
    {
      title: 'Identity and UAE Residency',
      intro: 'IRCC requires clear proof of identity and your legal status as a UAE resident.',
      items: [
        'Valid passport (minimum 6 months validity beyond your intended return date)',
        'Previous passports showing full travel history',
        'Emirates ID — front and back copy',
        'UAE Residence Visa copy',
        'Two recent passport-sized photographs (white background, specific Canada specifications)',
      ],
    },
    {
      title: 'Financial Evidence',
      intro: 'IRCC officers must be satisfied that you can fund your stay and have sufficient financial ties to return to the UAE after your visit.',
      items: [
        'Bank statements for the last 3–6 months (showing consistent balance and regular income)',
        'Salary certificate confirming your employment, position, and monthly income',
        'No Objection Certificate from employer confirming approved leave',
        'Last 3 months payslips',
        'Proof of assets — property, investments, or savings (strengthens your application)',
        'Business registration and audited accounts (if self-employed)',
      ],
    },
    {
      title: 'Travel and Purpose Documents',
      intro: 'You must clearly demonstrate why you are visiting Canada and provide credible evidence that you will leave before your authorised stay expires.',
      items: [
        'Flight itinerary / reservation (we provide this — accepted by IRCC)',
        'Hotel booking confirmation or invitation letter from Canadian host',
        'Detailed travel itinerary for your time in Canada',
        'Invitation letter from a Canadian host (if visiting family or friends)',
        'Evidence of ties to the UAE: employment, family, lease agreements, or property',
      ],
    },
  ],

  pricingBreakdown: [
    { item: 'Travl service fee',             amount: 699, currency: 'AED', paidTo: 'Travl',   note: 'Standard package; Concierge includes all government fees'                },
    { item: 'Canada Visitor Visa fee',        amount: 270, currency: 'AED', paidTo: 'IRCC',    note: 'Approx. AED 270 (CAD 100); per applicant, non-refundable'               },
    { item: 'Biometrics fee',                 amount: 230, currency: 'AED', paidTo: 'IRCC',    note: 'Approx. AED 230 (CAD 85); required for most first-time applicants'      },
    { item: 'VFS Canada service charge',      amount: 120, currency: 'AED', paidTo: 'VFS',     note: 'Applicable if biometrics or document submission via VFS; may vary'       },
  ],

  whyUs: [
    {
      title:       'IRCC application expertise',
      description: 'Canada\'s IRCC online portal is detailed and unforgiving — errors or omissions are a common refusal trigger. We complete your application with precision and verify every field before submission.',
      icon:        'FileSearch',
    },
    {
      title:       'Ties to UAE — our strongest asset',
      description: 'Demonstrating strong ties to the UAE is the single most important factor in a Canada visa application. We know exactly how to present your employment, financial, and personal circumstances to make this case effectively.',
      icon:        'MapPin',
    },
    {
      title:       'Refusal analysis and reapplication',
      description: 'If you\'ve been refused a Canada visa before, we review your refusal notice and rebuild your application to directly address the officer\'s concerns — not just resubmit the same file.',
      icon:        'RefreshCw',
    },
    {
      title:       'Multilingual team',
      description: 'Our specialists work in Arabic, Urdu, Hindi, and English — the four languages spoken by the vast majority of UAE-based Canada visa applicants.',
      icon:        'Users',
    },
  ],

  testimonials: [
    {
      name:        'Fatima Al-Zaabi',
      nationality: 'Emirati',
      visaType:    'Canada Visitor Visa',
      quote:       'Had been trying to get a Canada visa on my own for two years. Travl reviewed my file, rewrote my cover letter, and restructured how my financials were presented. Approved within 6 weeks.',
      rating:      5,
      initials:    'FZ',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Ravi Sharma',
      nationality: 'Indian',
      visaType:    'Canada Visitor Visa',
      quote:       'The IRCC portal was overwhelming. Travl handled the entire application, coordinated the biometrics appointment, and kept me updated throughout. Visa came through faster than expected.',
      rating:      5,
      initials:    'RS',
      imageUrl:    '',
      isFeatured:  true,
    },
    {
      name:        'Grace Adeola',
      nationality: 'Nigerian',
      visaType:    'Canada Visitor Visa',
      quote:       'Two refusals before Travl. They explained exactly what IRCC officers flag and made my ties to the UAE impossible to question. Got my visa on the third attempt — should have come to them first.',
      rating:      5,
      initials:    'GA',
      imageUrl:    '',
      isFeatured:  true,
    },
  ],

  faqs: [
    {
      question: 'How long does a Canada Visitor Visa take from the UAE?',
      answer:   'IRCC processing times for Canada Visitor Visas from UAE applicants typically range from 4 to 12 weeks, depending on application volumes and the complexity of the file. Online applications are generally faster than paper applications. We monitor your application actively and notify you of every status update.',
    },
    {
      question: 'Do I need to provide biometrics for a Canada visa?',
      answer:   'Yes. Most applicants between the ages of 14 and 79 who are applying for a Canada visa for the first time are required to provide biometric data (fingerprints and photograph) at a VFS Canada centre in Dubai or Abu Dhabi. Once your biometrics are on file with IRCC, they are valid for 10 years. We schedule your appointment and prepare you for the visit.',
    },
    {
      question: 'What is the most common reason Canada visas are refused for UAE residents?',
      answer:   'The most frequently cited refusal ground is that the officer was not satisfied the applicant will leave Canada at the end of their authorised stay. This is determined by assessing your ties to the UAE — stable employment, family, property, financial obligations — relative to any pull factors toward Canada. Weak or poorly presented ties to the UAE is the leading reason for refusals.',
    },
    {
      question: 'Can I reapply after a Canada visa refusal?',
      answer:   'Yes — there is no mandatory waiting period after a Canada TRV refusal. However, reapplying with the same application will almost certainly produce the same result. You must submit materially different or stronger evidence. Travl provides a full refusal analysis and rebuilds your application before any reapplication.',
    },
    {
      question: 'Is a flight reservation accepted for a Canada visa application?',
      answer:   'Yes. IRCC accepts flight itineraries and reservations as supporting documents for Visitor Visa applications. You are not expected to hold fully confirmed, non-refundable tickets before applying. Our GDS-based reservations carry a verifiable booking reference appropriate for IRCC submissions.',
    },
    {
      question: 'How much money do I need to show for a Canada visa?',
      answer:   'IRCC does not publish a fixed minimum, but as a general benchmark for UAE applicants visiting Canada for 2–3 weeks, bank balances of AED 15,000–25,000 maintained over 3–6 months are appropriate. Funds must be stable — not deposited shortly before the application. We review your financials and advise on how to present them most effectively.',
    },
    {
      question: 'Can I apply for a Canada visa if I only have a temporary UAE residency?',
      answer:   'Yes. UAE residence visa holders — including those on employment, investor, or family-sponsored visas — can apply for a Canadian Visitor Visa regardless of residence visa category. Your UAE residency status is one factor among many; employment stability, financial evidence, and ties to your home country also carry significant weight.',
    },
  ],

  finalCtaHeadline: 'Ready to apply for your Canada visa?',
  finalCtaText:     'Get free consultation',
  metaTitle:        'Canada Visa from UAE | TRV Visa Assistance | Travl',
  metaDescription:  'Expert Canada Visitor Visa assistance for UAE residents. IRCC application, biometrics support & full file preparation. From AED 699. Start today.',
};

async function seed() {
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const redactedUri = MONGO_URI.replace(/:\/\/[^@]+@/, '://***@');
  console.log(`\n✅  Connected → ${redactedUri}`);

  const Visa = conn.model('Visa', VisaSchema);

  const visas  = [SCHENGEN, UK, USA, CANADA];
  const slugs  = visas.map((v) => v.slug);

  const deleted = await Visa.deleteMany({ slug: { $in: slugs } });
  if (deleted.deletedCount > 0) {
    console.log(`🗑   Deleted ${deleted.deletedCount} existing visa doc(s): ${slugs.join(', ')}`);
  }

  const inserted = await Visa.insertMany(visas);

  console.log('\n🌍  Seeded visa documents:\n');
  inserted.forEach((v, i) => {
    console.log(`  [${i + 1}] ${v.countryName}`);
    console.log(`      _id    : ${v._id}`);
    console.log(`      slug   : ${v.slug}`);
    console.log(`      status : ${v.status}`);
    console.log(`      pkgs   : ${v.packages.length} packages, ${v.faqs.length} FAQs, ${v.testimonials.length} testimonials`);
    console.log('');
  });

  console.log('🔍  Verifying queryability...');
  for (const slug of slugs) {
    const found = await Visa.findOne({ slug, status: 'published' }).lean();
    if (found) {
      console.log(`  ✅  ${slug} → "${found.heroHeadline}"`);
    } else {
      console.error(`  ❌  Could not re-query "${slug}"`);
    }
  }

  console.log('\n✨  Done.\n');
  await conn.close();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
