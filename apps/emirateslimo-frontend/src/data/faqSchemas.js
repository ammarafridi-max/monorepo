import { airportTransferFaqs, allFaqs, brandFaqs, chauffeurFaqs, dubaiTransferFaqs } from './faqs';

export const brandFaqsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: brandFaqs.map((faq) => {
    return {
      '@type': 'Question',
      name: faq?.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq?.answer,
      },
    };
  }),
};

export const chauffeurFaqsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: chauffeurFaqs.map((faq) => {
    return {
      '@type': 'Question',
      name: faq?.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq?.answer,
      },
    };
  }),
};

export const airportTransferFaqsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: airportTransferFaqs.map((faq) => {
    return {
      '@type': 'Question',
      name: faq?.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq?.answer,
      },
    };
  }),
};

export const dubaiTransferFaqsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: dubaiTransferFaqs.map((faq) => {
    return {
      '@type': 'Question',
      name: faq?.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq?.answer,
      },
    };
  }),
};

export const allFaqsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqs.map((faq) => {
    return {
      '@type': 'Question',
      name: faq?.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq?.answer,
      },
    };
  }),
};
