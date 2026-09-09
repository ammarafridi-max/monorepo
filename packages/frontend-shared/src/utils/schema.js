export function createSchemaBuilders({
  siteUrl,
  siteName,
  legalName,
  sameAs,
  telephone,
  logoUrl,
  email,
  address,
  contactPoint,
}) {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const buildOrganization = () => ({
    "@type": "Organization",
    "@id": organizationId,
    name: siteName,
    ...(legalName ? { legalName } : {}),
    url: siteUrl,
    logo: { "@type": "ImageObject", url: logoUrl },
    ...(email ? { email } : {}),
    ...(telephone ? { telephone } : {}),
    ...(sameAs?.length ? { sameAs } : {}),
    ...(address ? { address: { "@type": "PostalAddress", ...address } } : {}),
    ...(contactPoint
      ? { contactPoint: { "@type": "ContactPoint", ...contactPoint } }
      : {}),
  });

  const buildWebsite = () => ({
    "@type": "WebSite",
    "@id": websiteId,
    name: siteName,
    url: siteUrl,
    publisher: { "@id": organizationId },
  });

  const buildWebPage = ({ canonical, title, description }) => ({
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
  });

  // A tag or category listing is a CollectionPage, not a Blog: Blog describes
  // the publication itself. `items` becomes an ItemList so the listing order is
  // explicit rather than inferred from the DOM.
  const buildCollectionPage = ({ canonical, title, description, items = [] }) => ({
    "@type": "CollectionPage",
    "@id": `${canonical}#collectionpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    ...(items.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: item.url,
              name: item.name,
            })),
          },
        }
      : {}),
  });

  const buildBlog = ({ canonical, title, description }) => ({
    "@type": "Blog",
    "@id": `${canonical}#blog`,
    url: canonical,
    name: title,
    description,
    publisher: { "@id": organizationId },
  });

  const authorId = (slug) => `${siteUrl}/authors/${slug}#person`;

  /**
   * A byline is only an E-E-A-T signal if it resolves to something. An author
   * with a slug becomes a real Person node other pages reference by @id; one
   * without stays an inline name, which is all we can honestly claim.
   */
  const buildPerson = ({ name, slug, jobTitle, bio, image, sameAs, expertise }) => {
    if (!name) return undefined;
    if (!slug) return { "@type": "Person", name };

    const url = `${siteUrl}/authors/${slug}`;
    const knowsAbout = (expertise ?? []).filter(Boolean);
    const profiles = (sameAs ?? []).filter(Boolean);

    return {
      "@type": "Person",
      "@id": authorId(slug),
      name,
      url,
      ...(jobTitle ? { jobTitle } : {}),
      ...(bio ? { description: bio } : {}),
      ...(image ? { image: { "@type": "ImageObject", url: image } } : {}),
      ...(knowsAbout.length ? { knowsAbout } : {}),
      ...(profiles.length ? { sameAs: profiles } : {}),
      worksFor: { "@id": organizationId },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    };
  };

  const buildProfilePage = ({ canonical, title, description, slug }) => ({
    "@type": "ProfilePage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": websiteId },
    ...(slug ? { mainEntity: { "@id": authorId(slug) } } : {}),
  });

  const buildBlogPosting = ({
    canonical,
    title,
    description,
    image,
    datePublished,
    dateModified,
    authorName,
    authorSlug,
  }) => ({
    "@type": "BlogPosting",
    "@id": `${canonical}#blogpost`,
    headline: title,
    description,
    image: image ? [image] : undefined,
    author: authorName
      ? authorSlug
        ? { "@id": authorId(authorSlug) }
        : { "@type": "Person", name: authorName }
      : undefined,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    publisher: { "@id": organizationId },
    mainEntityOfPage: { "@id": `${canonical}#webpage` },
  });

  // `offers` takes the brand's own package shape ({ name, price, currency,
  // description }) and is omitted entirely when empty, so a page with no
  // pricing emits the same Service node it always did.
  const buildService = ({ canonical, name, description, areaServed, offers = [] }) => {
    const priced = (offers || []).filter((o) => Number(o?.price) > 0);

    return {
      "@type": "Service",
      "@id": `${canonical}#service`,
      name,
      description,
      serviceType: name,
      url: canonical,
      areaServed,
      provider: { "@id": organizationId },
      ...(priced.length
        ? {
            offers: priced.map((o) => ({
              "@type": "Offer",
              "@id": `${canonical}#offer-${String(o.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              name: o.name,
              ...(o.description ? { description: o.description } : {}),
              url: canonical,
              availability: "https://schema.org/InStock",
              priceSpecification: {
                "@type": "PriceSpecification",
                price: Number(o.price),
                priceCurrency: o.currency || "AED",
                valueAddedTaxIncluded: true,
              },
            })),
          }
        : {}),
    };
  };

  const buildProduct = ({
    canonical,
    name,
    description,
    price,
    currency = "USD",
    availability = "https://schema.org/InStock",
  }) => ({
    "@type": "Product",
    "@id": `${canonical}#product`,
    name,
    description,
    url: canonical,
    brand: { "@id": organizationId },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability,
      url: canonical,
      seller: { "@id": organizationId },
    },
  });

  return {
    buildOrganization,
    buildWebsite,
    buildWebPage,
    buildCollectionPage,
    buildBlog,
    buildBlogPosting,
    buildPerson,
    buildProfilePage,
    buildService,
    buildProduct,
  };
}

const toAbsoluteUrl = ({ baseUrl = "", value = "/", basePath = "" }) => {
  if (!value) return baseUrl;
  if (/^https?:\/\//.test(value)) return value;

  const normalizedBasePath = basePath
    ? `/${String(basePath).replace(/^\/+|\/+$/g, "")}`
    : "";
  const normalizedValue = value.startsWith("/") ? value : `/${value}`;
  const needsBasePath =
    normalizedBasePath &&
    normalizedValue !== normalizedBasePath &&
    !normalizedValue.startsWith(`${normalizedBasePath}/`);

  return `${baseUrl}${needsBasePath ? `${normalizedBasePath}${normalizedValue}` : normalizedValue}`;
};

export const buildFAQPage = ({ canonical, title, description, faqs }) => ({
  "@type": "FAQPage",
  "@id": `${canonical}#faq`,
  url: canonical,
  name: title,
  description,
  mainEntity: (faqs || []).map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const buildBreadcrumbList = ({
  paths = [],
  baseUrl = "",
  basePath = "",
} = {}) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: paths.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.label,
    item: toAbsoluteUrl({
      baseUrl,
      value: item.href || item.path || "/",
      basePath,
    }),
  })),
});

export const buildGraph = (items) => ({
  "@context": "https://schema.org",
  "@graph": items,
});
