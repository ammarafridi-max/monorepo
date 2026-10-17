/**
 * The verdict-first answer that opens each landing page, drafted from that
 * page's own FAQ entries so nothing here states a fact the page did not
 * already make and stand behind.
 *
 * First sentence carries the verdict. Nothing claims a figure that is not in
 * src/config.js or the page's FAQ array.
 */

export const QUICK_ANSWERS = {
  home: {
    question: 'What is a dummy ticket?',
    answer:
      'A dummy ticket is a genuine flight reservation issued on airline systems with a live PNR, not a purchased ticket. Embassies and visa application centres accept it as proof of your travel plans. You pick the validity at checkout, from AED 49 for 2 days, and it reaches you by email within 10 to 15 minutes, any hour of the day.',
  },

  schengen: {
    question: 'Will a dummy ticket work for a Schengen visa?',
    answer:
      'Yes. Schengen embassies and visa centres including VFS and BLS accept a genuine flight reservation with a verifiable PNR as proof of onward and return travel. You do not need to buy a real ticket before your visa is approved. Order one to three days before your appointment so the reservation is still live when the consulate opens your file.',
  },

  usVisa: {
    question: 'Is a dummy ticket accepted for a US visa?',
    answer:
      'Yes. A dummy ticket is a genuine reservation with a live PNR that a consular officer can verify in the airline systems, so you do not need to buy airfare before your interview. Validity starts at AED 49 for 2 days, and the reservation arrives by email in 10 to 15 minutes.',
  },

  emirates: {
    question: 'Can I verify an Emirates dummy ticket online?',
    answer:
      'Yes. Every Emirates reservation we issue carries a valid PNR you or the visa officer can check on the Emirates website under Manage Booking. Applicants use them as travel proof for Schengen, US, UK and Canada visas. You do not need to buy a real Emirates ticket before your visa is approved.',
  },

  etihad: {
    question: 'Is an Etihad dummy ticket valid for a Schengen or UK visa?',
    answer:
      'Yes. Our Etihad reservations meet the proof of booked flight requirement for Schengen, UK, US B1/B2 and Canadian TRV applications. Each one carries a live PNR verifiable on Etihad Manage My Booking, the same reference a visa officer checks. A flexible Etihad ticket costs AED 2,500 or more; the reservation costs from AED 49.',
  },

  itinerary: {
    question: 'What is a flight itinerary for a visa application?',
    answer:
      'A flight itinerary is a genuine flight reservation issued on airline systems with a live PNR, showing your route, dates and passenger name. Embassies accept it as proof of travel plans without you buying a ticket. It can be verified in Amadeus, Sabre or Travelport, the same systems embassies and airlines use.',
  },

  onward: {
    question: 'What is an onward ticket and when do you need one?',
    answer:
      'An onward ticket is a confirmed flight reservation showing you will leave your destination country, used at the airport rather than at an embassy. Thailand, Vietnam, Indonesia, Costa Rica and Peru are among the countries that ask for proof of onward travel on arrival, and some airlines check it before boarding. Ours stay active for 7 or 14 days from issue.',
  },

  insurance: {
    question: 'Is travel insurance mandatory for UAE residents travelling abroad?',
    answer:
      'Many countries require valid travel insurance as part of the visa application, and Schengen states make it a strict requirement. Our plans are genuine underwritten policies from a licensed insurer, not placeholder documents, and include the EUR 30,000 minimum medical cover Schengen consulates ask for. They are accepted at embassies, VFS and BLS.',
  },

  schengenInsurance: {
    question: 'Is travel insurance mandatory for a Schengen visa?',
    answer:
      'Yes. Every Schengen visa application needs insurance covering at least EUR 30,000 in medical expenses, valid across all 27 Schengen countries for the full trip, including emergency treatment, hospitalisation and repatriation. Our AXA-backed policy meets that requirement and is accepted at VFS and BLS. From AED 30, delivered in minutes.',
  },

  faq: {
    question: 'How fast do you issue a dummy ticket, and how is it verified?',
    answer:
      'Every booking is created and sent within 10 to 15 minutes of payment, 24 hours a day. It is a real reservation with a live PNR, verifiable through the global distribution systems that embassies, airlines and travel agents use: Amadeus, Sabre and Travelport. With Emirates and Etihad you can also check it under Manage Booking.',
  },
};
