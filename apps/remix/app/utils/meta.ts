import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';

export const appMetaTags = (title?: string) => {
  const description =
    'MJ Limousine Service client portal for signing service agreements, invoices, and contracts. Fast, secure, and professional document signing for our valued clients.';

  return [
    {
      title: title ? `${title} - MJ Limousine Service` : 'MJ Limousine Service',
    },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content:
        'MJ Limousine Service, limousine, document signing, service agreement, invoice, contract',
    },
    {
      name: 'author',
      content: 'MJ Limousine Service',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      property: 'og:title',
      content: 'MJ Limousine Service - Client Document Portal',
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '@mjlimousine',
    },
    {
      name: 'twitter:description',
      content: description,
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
  ];
};
