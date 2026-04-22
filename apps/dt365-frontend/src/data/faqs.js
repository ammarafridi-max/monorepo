export const faqArray = [
  {
    question: 'What is a {keyword}?',
    answer:
      'A {keyword} is a temporary and verifiable flight reservation that shows your planned onward or return travel. It is commonly used when airlines or immigration authorities ask for proof that you intend to leave the destination country within the allowed period.',
  },
  {
    question: 'What is a {keyword} used for?',
    answer:
      'A {keyword} is typically used as proof of onward or return travel during airline check-in or immigration screening. Travelers often use it when they are required to show travel plans without committing to a full-priced airline ticket.',
  },
  {
    question: 'Does a {keyword} include a verifiable PNR?',
    answer:
      'Yes, every {keyword} comes with a valid PNR (Passenger Name Record) that can usually be verified on the airline’s official website or reservation system, depending on the airline’s verification method.',
  },
  {
    question: 'How can I verify my {keyword}?',
    answer:
      'You can verify your {keyword} by entering the PNR code along with the passenger’s last name on the airline’s website. In some cases, verification may only be possible through the airline’s customer support.',
  },
  {
    question: 'How much does a {keyword} cost?',
    answer:
      'The cost of a {keyword} starts from USD 13 and may vary based on the itinerary type, validity duration, and availability selected at the time of booking.',
  },
  {
    question: 'How long is a {keyword} valid for?',
    answer:
      'You can choose a {keyword} validity of 48 hours, 7 days, or 14 days. The validity period should match the timeframe in which you need to present proof of onward travel.',
  },
  {
    question: 'How long does it take to receive my {keyword}?',
    answer:
      'Most {keyword}s are generated automatically and delivered by email within 10 to 15 minutes after successful payment, making it suitable for urgent travel needs.',
  },
  {
    question: 'Can I use a {keyword} for airline check-in?',
    answer:
      'Yes, many travelers use a {keyword} during airline check-in when asked to show proof of onward or return travel. Acceptance ultimately depends on the airline’s policies.',
  },
  {
    question: 'Is a {keyword} suitable for immigration checks?',
    answer:
      'A {keyword} is commonly used when immigration officers request proof of onward travel. However, final acceptance is always at the discretion of immigration authorities.',
  },
  {
    question: 'Do I need to buy an actual flight ticket?',
    answer:
      'No, a {keyword} allows you to demonstrate onward travel plans without purchasing an actual airline ticket, helping you avoid unnecessary costs.',
  },
  {
    question: 'Can I book a one-way or return {keyword}?',
    answer:
      'Yes, you can choose between one-way or return {keyword} options based on your travel route and the requirements of the airline or immigration authority.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept secure online payments through Stripe, allowing you to pay using major credit and debit cards in a safe and encrypted checkout environment.',
  },
  {
    question: 'Is there a refund or money-back guarantee?',
    answer:
      'No, once a {keyword} has been issued and delivered, it is non-refundable, as the reservation is generated specifically for your travel details.',
  },
];

export function formatFaqArray(arr, keyword) {
  const newFaqs = arr.map(arr => {
    const question = arr.question.replaceAll('{keyword}', keyword);
    const answer = arr.answer.replaceAll('{keyword}', keyword);
    return { question, answer };
  });

  return newFaqs;
}


export const homepageFaqs = [
  {
    question: 'What is a dummy ticket and do I need one for my visa?',
    answer:
      'A dummy ticket is a genuine flight reservation with a verifiable PNR, used to show proof of travel intent for a visa application. Most embassies and visa centres accept them in place of a fully paid ticket.',
  },
  {
    question: 'Do your dummy tickets work for Schengen visa applications?',
    answer:
      'Yes. Our dummy tickets meet the documentation requirements for Schengen applications and are accepted by VFS, BLS, and embassies. They include a verifiable PNR and are formatted to match what visa officers expect.',
  },
  {
    question: 'Can you provide hotel reservations for a visa application?',
    answer:
      'Yes. We provide hotel reservations on request, formatted to meet embassy requirements. Send us your trip details and we will prepare the reservation for you.',
  },
  {
    question: 'Does your travel insurance meet Schengen requirements?',
    answer:
      'Yes. Our travel insurance plans include the mandatory minimum medical coverage and are valid across all 26 Schengen member states.',
  },
  {
    question: 'How quickly will I receive my documents?',
    answer:
      'Dummy tickets and travel insurance are delivered to your inbox within minutes of payment. Hotel reservations are processed on request and typically delivered within a few hours during working hours.',
  },
  {
    question: 'What visa types do your services support?',
    answer:
      'Our services are suitable for a wide range of visa applications, including Schengen, UK, Canada, Australia, Turkey, Thailand, and more.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      "We accept card payments through Stripe's secure checkout. Payment links are also available on request.",
  },
  {
    question: 'Is visa assistance available?',
    answer:
      'We are launching a full visa assistance service soon. In the meantime, we can help with all the supporting documents your application needs.',
  },
];

export const insuranceFaqs = [
  {
    question: 'Is travel insurance mandatory for UAE residents?',
    answer:
      'Yes, many countries require valid travel insurance, especially Schengen states and other visa-based international destinations.',
  },
  {
    question: 'Does this travel insurance meet Schengen visa requirements?',
    answer:
      'Yes, our plans include minimum €30,000 medical coverage required for Schengen visa applications and embassy approval.',
  },
  {
    question: 'How quickly will I receive my insurance policy?',
    answer:
      'Your travel insurance policy is issued instantly and delivered to your email within minutes after successful payment.',
  },
  {
    question: 'Can UAE residents purchase travel insurance online?',
    answer:
      'Yes, UAE residents can purchase and receive fully valid travel insurance online without visiting any office.',
  },
  {
    question: 'What does the travel insurance cover?',
    answer:
      'Coverage includes emergency medical expenses, hospitalization, trip cancellation, baggage loss, and other unexpected travel incidents.',
  },
  {
    question: 'Is COVID-19 covered under the travel insurance?',
    answer:
      'Yes, most plans include COVID-19 medical coverage during your international trip, subject to policy terms.',
  },
  {
    question: 'Can I buy travel insurance after booking my flight?',
    answer:
      'Yes, you can purchase travel insurance anytime before your departure date, even after flight confirmation.',
  },
  {
    question: 'How do I buy travel insurance online in the UAE?',
    answer:
      'Select your trip dates and destination, add traveler details, and complete secure payment online to receive your travel insurance policy instantly by email.',
  },
  {
    question: 'Do you offer instant travel insurance for visa applications?',
    answer:
      'Yes, we provide travel insurance with instant policy delivery that is suitable for embassy and visa applications, including Schengen requirements.',
  },
  {
    question: 'Is this travel insurance valid worldwide?',
    answer:
      'Yes, coverage is available for most international destinations depending on your selected region and policy type.',
  },
  {
    question: 'Can I get travel insurance for family or group travel?',
    answer:
      'Yes, you can insure multiple travelers in one booking by selecting the number of adults, children, and seniors during checkout.',
  },
  {
    question: 'Can I extend my travel insurance policy?',
    answer:
      'Yes, policy extensions are possible before expiry, subject to insurer approval and eligibility conditions.',
  },
  {
    question: 'What documents are required to purchase travel insurance?',
    answer:
      'You only need basic travel details, passport information, destination country, and confirmed travel dates.',
  },
  {
    question: 'Is travel insurance refundable if my visa is rejected?',
    answer:
      'Some plans offer refunds after visa rejection, depending on policy terms and supporting documentation.',
  },
];
