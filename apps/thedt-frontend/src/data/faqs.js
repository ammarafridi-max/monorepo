export const faqArray = [
  {
    question: 'What is a {keyword}?',
    answer:
      'A {keyword} is a real airline reservation that holds a seat under a live PNR without you paying the fare. It exists in the same booking systems a paid ticket lives in, which is why an embassy can check it. The only difference is that nobody has settled the fare, so the seat releases itself once the hold runs out.',
  },
  {
    question: 'How can I verify the {keyword}?',
    answer:
      'Take the PNR we email you and look it up in Amadeus, Sabre or Travelport, the systems embassies and travel agents already use. Some airlines, Emirates and Etihad among them, will also show it under Manage Booking on their own site. Plenty of airlines never display an unpaid hold publicly, so treat the GDS lookup as the reliable check and the airline website as a bonus.',
  },
  {
    question: 'How much does a {keyword} cost?',
    answer:
      'You pay for how long the reservation stays live, not for the route. Two days is AED 49, seven days is AED 69, fourteen days is AED 79. One way and return cost the same, and the price is per traveller.',
  },
  {
    question: 'How long is your {keyword} valid for?',
    answer:
      'For as long as you choose at checkout: 2 days at AED 49, 7 days at AED 69, or 14 days at AED 79. Pick the window that covers your appointment and any follow-up the consulate might ask for, not the length of your holiday.',
  },
  {
    question: 'How long does it take to receive my {keyword}?',
    answer:
      'Between 10 and 15 minutes from payment, at any hour. If your appointment is sooner than that and you are watching the clock, reply to your order email and we will push it to the front.',
  },
  {
    question: 'Do {keyword}s work for Schengen applications?',
    answer:
      'Yes. Article 14 of the EU Visa Code asks for evidence of your transport arrangements, not for a paid ticket, and a reservation with a live PNR answers that. VFS and BLS centres handle these every day.',
  },
  {
    question: 'Will my application get rejected due to {keyword}s?',
    answer:
      'Not for using one. Consulates expect a reservation at this stage, which is why they ask for an itinerary rather than a receipt. Refusals turn on things like funds, ties to your home country, or an inconsistent story, so put your effort there.',
  },
  {
    question: 'I need hotel reservations too. Can you provide that?',
    answer:
      'Yes. Email us the cities and dates and we will send back a hotel reservation laid out the way visa officers expect to see it. We would rather do it by email than through a form, because accommodation details change more often than flights do.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Cards through Stripe Checkout, which is what the site uses by default. If you would rather pay from a different account or need an invoice first, ask us for a payment link.',
  },
  {
    question: 'Is the {keyword} suitable for all travel applications?',
    answer:
      'It works anywhere the requirement is proof of intended travel, which covers Schengen, the UK, Canada, Turkey, Thailand and the UAE among others. The one case it does not cover is an airline asking for a paid onward ticket at the gate, because that is a fare, not evidence.',
  },
  {
    question: 'What additional services do you offer?',
    answer:
      'Hotel reservations, genuine AXA travel insurance, help assembling the rest of a visa file, and airport transfers when you need one.',
  },
  {
    question: 'How can I contact customer support?',
    answer:
      'Email info@thedummyticket.ae. Someone is on it around the clock and replies usually land inside 10 to 15 minutes.',
  },
  {
    question: 'Is there a money-back guarantee?',
    answer:
      'One clear case: if the refusal letter says your flight reservation had expired or could not be verified, send it to us and we refund the order in full. A change of heart or a refusal on other grounds is not covered. If your appointment simply moves, tell us and we reissue with new dates for free.',
  },
];

export const insuranceFaqs = [
  {
    question: 'Is travel insurance mandatory for UAE residents?',
    answer:
      'It depends where you are going. Schengen states make it a condition of the visa, and a handful of other countries do too. Everywhere else it is optional on paper, though a hospital bill abroad has a way of making the argument for you.',
  },
  {
    question: 'Does this travel insurance meet Schengen visa requirements?',
    answer:
      'Yes. Every plan we issue carries at least EUR 30,000 of medical cover and is valid across all Schengen member states, which is the threshold consulates check against.',
  },
  {
    question: 'How quickly will I receive my insurance policy?',
    answer:
      'The policy is issued the moment payment clears and arrives by email within a few minutes, with the certificate attached in the format visa centres accept.',
  },
  {
    question: 'Can UAE residents purchase travel insurance online?',
    answer:
      'Yes, start to finish, with nothing to sign in person and no branch visit.',
  },
  {
    question: 'What does the travel insurance cover?',
    answer:
      'Emergency medical treatment and hospital stays, repatriation, trip cancellation, and lost or delayed baggage. The policy wording sets out the limits for each, and it is worth two minutes of your time before you travel.',
  },
  {
    question: 'Is COVID-19 covered under the travel insurance?',
    answer:
      'Most plans treat it as any other illness needing emergency medical care while you are abroad, subject to the policy terms.',
  },
  {
    question: 'Can I buy travel insurance after booking my flight?',
    answer:
      'Yes, any time before you depart. Buying earlier is the better move, since cancellation cover only helps for things that go wrong after the policy starts.',
  },
  {
    question: 'How do I buy travel insurance online in the UAE?',
    answer:
      'Enter your destination and travel dates, add each traveller, and pay. The policy is emailed to you straight after, ready to attach to a visa file.',
  },
  {
    question: 'Do you offer instant travel insurance for visa applications?',
    answer:
      'Yes. Delivery is immediate and the certificate meets embassy requirements, Schengen included.',
  },
  {
    question: 'Is this travel insurance valid worldwide?',
    answer:
      'Cover follows the region you select at checkout. Worldwide options are available, so pick the one that actually matches your route rather than the cheapest line on the page.',
  },
  {
    question: 'Can I get travel insurance for family or group travel?',
    answer:
      'Yes. Add every traveller to the same booking and each one gets their own certificate under one payment.',
  },
  {
    question: 'Can I extend my travel insurance policy?',
    answer:
      'Usually, as long as you ask before the current policy expires and the insurer agrees. Once it lapses you are buying a new one instead.',
  },
  {
    question: 'What documents are required to purchase travel insurance?',
    answer:
      'Passport details for each traveller, your destination, and your travel dates. Nothing else.',
  },
  {
    question: 'Is travel insurance refundable if my visa is rejected?',
    answer:
      'Some plans refund the premium if you send the refusal letter, others do not. Check the wording on the plan you pick before you buy, and ask us if it is unclear.',
  },
];

export function formatFaqArray(arr, keyword = 'dummy ticket') {
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
      'It is a real flight reservation with a verifiable PNR that shows where you intend to travel, without you paying the fare. Most consulates and visa centres ask for exactly this at the application stage, because buying a ticket before a decision is a risk they do not expect you to take.',
  },
  {
    question: 'Do your dummy tickets work for Schengen visa applications?',
    answer:
      'Yes, and it is the most common reason people order one. The reservation carries a live PNR that VFS, BLS and consulate staff can verify, and it is laid out the way they expect to receive it.',
  },
  {
    question: 'Can you provide hotel reservations for a visa application?',
    answer:
      'Yes, on request. Send us your cities and dates by email and we will prepare a reservation formatted for a visa file.',
  },
  {
    question: 'Does your travel insurance meet Schengen requirements?',
    answer:
      'Yes. Every plan carries the mandatory minimum medical cover and is valid across all Schengen member states.',
  },
  {
    question: 'How quickly will I receive my documents?',
    answer:
      'Dummy tickets and insurance policies arrive within minutes of payment, at any hour. Hotel reservations are put together by hand, so those usually come back the same working day.',
  },
  {
    question: 'What visa types do your services support?',
    answer:
      'Anything that asks for proof of intended travel: Schengen, UK, Canada, Australia, Turkey, Thailand and more.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Cards through Stripe Checkout, with payment links available if you ask for one.',
  },
  {
    question: 'Is visa assistance available?',
    answer:
      'Full visa assistance is on the way. Until it launches we can still help you put together every supporting document an application needs.',
  },
];
