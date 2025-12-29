import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'MoveBridge SDK',
  tagline: 'The complete TypeScript SDK for Movement Network - ethers.js for Movement',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Update this to your Netlify URL after deployment
  url: 'https://movebridge.netlify.app',
  baseUrl: '/',

  organizationName: 'AqilaRifti',
  projectName: 'MoveBridge',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/AqilaRifti/MoveBridge/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/movebridge-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'MoveBridge',
        src: 'img/logo-navbar.svg',
        width: 40,
        height: 28,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://github.com/AqilaRifti/MoveBridge',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Core SDK',
              to: '/docs/packages/core',
            },
            {
              label: 'React Integration',
              to: '/docs/packages/react',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: '@movebridge/core',
              to: '/docs/packages/core',
            },
            {
              label: '@movebridge/react',
              to: '/docs/packages/react',
            },
            {
              label: '@movebridge/codegen',
              to: '/docs/packages/codegen',
            },
            {
              label: '@movebridge/testing',
              to: '/docs/packages/testing',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/AqilaRifti/MoveBridge',
            },
            {
              label: 'Movement Network',
              href: 'https://movementlabs.xyz',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aqila Rifti. MIT License. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'json'],
    },
    algolia: undefined,
  } satisfies Preset.ThemeConfig,
};

export default config;
