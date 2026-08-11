export const homepageFaqs = [
  {
    question: "What does VisaWadi actually do?",
    answer:
      "We prepare visa applications for UAE residents from start to finish. That means reviewing your documents against what the embassy is asking for right now, writing the cover letter and financial summary, assembling the full file, booking your appointment at the visa centre, and following the application until your passport comes back.",
  },
  {
    question: "Which visas can you help with?",
    answer:
      "Schengen, the United Kingdom, the United States and Canada, plus France, Germany, Italy and Spain handled individually. If your destination is not listed, get in touch and we will tell you honestly whether we can help.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Packages start from AED 299. Embassy and visa-centre fees are separate and passed through at cost, never marked up. The exact breakdown for your destination is on that visa page before you commit to anything.",
  },
  {
    question: "Can you help if I have been refused before?",
    answer:
      "Yes, and it is one of the most common reasons people come to us. We start with your refusal notice to work out the exact grounds, then rebuild the file around them. Second applications do well when the first one has been properly analysed.",
  },
  {
    question: "Do I still need travel insurance and a flight reservation?",
    answer:
      "Almost always, yes. Schengen requires insurance with at least EUR 30,000 of cover, and most embassies want a flight reservation as proof of onward travel. We tell you exactly what your embassy expects and where those documents fit in your file.",
  },
  {
    question: "How long does an application take?",
    answer:
      "Standard processing is usually around 15 calendar days from your appointment, though it varies by embassy and stretches over July, August, Christmas and Eid. Faster options are available on some destinations. We give you a realistic timeline before you start.",
  },
  {
    question: "Do I have to visit your office?",
    answer:
      "No. Everything up to the appointment can be handled online, and most clients never come in. You are welcome to visit our Dubai office for a face-to-face consultation if you would rather talk in person.",
  },
  {
    question: "How quickly will someone reply?",
    answer:
      "Message us during business hours and you will usually hear back within three minutes. Outside them, within the hour.",
  },
];

/**
 * Longer set for the standalone /faq page. Covers the operational questions
 * people ask once they are past the homepage: fees, timelines, refusals and
 * what is and is not included.
 *
 * Insurance policies, flight reservations and day-by-day itineraries appear
 * here only as documents an applicant supplies. VisaWadi does not sell them.
 */
export const faqPageFaqs = [
  ...homepageFaqs,
  {
    question: 'What is included in your fee, and what is not?',
    answer:
      'Our fee covers document review, file preparation, your cover letter and financial summary, appointment booking at the visa centre, and support until a decision is made. Embassy and visa-centre fees are not included. Those are set by the embassy, we pass them through at cost, and we never mark them up.',
  },
  {
    question: 'Do you provide travel insurance or flight reservations?',
    answer:
      'No. We prepare visa applications and nothing else. Your file will usually need an insurance policy and proof of onward travel, so we tell you exactly what your embassy requires and what format it needs to be in, but you buy those separately.',
  },
  {
    question: 'What happens if my visa is refused?',
    answer:
      'We go through the refusal notice with you and explain the exact grounds the embassy cited. If you want to reapply, we rebuild the file around those grounds. No one can promise an approval, because that decision belongs to the embassy, but a refusal that has been properly analysed makes a much stronger second application.',
  },
  {
    question: 'Can you guarantee my visa will be approved?',
    answer:
      'No, and be careful with anyone who says they can. The decision rests entirely with the embassy. What we control is the quality of the file: complete documents, in the right format, with a financial story that holds together. That is what moves the odds.',
  },
  {
    question: 'How do I send you my documents?',
    answer:
      'Once your application is open you get a secure link where you upload each document as you gather it. You can see what is still outstanding at a glance, and nothing gets emailed around as attachments.',
  },
  {
    question: 'When do I pay?',
    answer:
      'You pay before we start preparing the file. Embassy and visa-centre fees are paid separately, either directly by you at the appointment or passed through at cost, depending on the destination.',
  },
];
