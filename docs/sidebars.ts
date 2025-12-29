import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'getting-started',
      label: 'Getting Started',
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/wallet-connection',
        'guides/transactions',
        'guides/contracts',
        'guides/events',
        'guides/error-handling',
      ],
    },
    {
      type: 'category',
      label: 'Packages',
      collapsed: false,
      items: [
        'packages/core',
        'packages/react',
        'packages/codegen',
        'packages/testing',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: [
        'examples/basic-usage',
        'examples/react-app',
        'examples/contract-interaction',
      ],
    },
    {
      type: 'doc',
      id: 'architecture',
      label: 'Architecture',
    },
    {
      type: 'doc',
      id: 'migration',
      label: 'Migration Guide',
    },
  ],
  apiSidebar: [
    {
      type: 'category',
      label: '@movebridge/core',
      collapsed: false,
      items: [
        'api/core/movement',
        'api/core/wallet-manager',
        'api/core/transaction-builder',
        'api/core/contract-interface',
        'api/core/event-listener',
        'api/core/errors',
        'api/core/types',
      ],
    },
    {
      type: 'category',
      label: '@movebridge/react',
      collapsed: false,
      items: [
        'api/react/provider',
        'api/react/hooks',
        'api/react/components',
      ],
    },
    {
      type: 'category',
      label: '@movebridge/codegen',
      collapsed: false,
      items: [
        'api/codegen/cli',
        'api/codegen/parser',
        'api/codegen/generator',
      ],
    },
    {
      type: 'category',
      label: '@movebridge/testing',
      collapsed: false,
      items: [
        'api/testing/harness',
        'api/testing/faker',
        'api/testing/validators',
        'api/testing/simulator',
      ],
    },
  ],
};

export default sidebars;
