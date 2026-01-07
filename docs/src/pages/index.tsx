import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

// Import logo as component
import BridgeLogo from '@site/static/img/logo.svg';

const vanillaCode = `import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });

// Connect wallet
await movement.wallet.connect('razor');

// Get balance
const balance = await movement.getAccountBalance(
  movement.wallet.getState().address!
);

// Transfer tokens
const hash = await movement.transaction.signAndSubmit(
  await movement.transaction.transfer({
    to: '0x123...',
    amount: '1000000',
  })
);`;

const reactCode = `import { 
  MovementProvider, 
  useMovement, 
  useBalance 
} from '@movebridge/react';

function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <WalletInfo />
    </MovementProvider>
  );
}

function WalletInfo() {
  const { address, connect, wallets } = useMovement();
  const { balance } = useBalance();

  return (
    <div>
      <p>Balance: {balance} MOVE</p>
      <button onClick={() => connect(wallets[0])}>
        Connect Wallet
      </button>
    </div>
  );
}`;

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGlow}></div>
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <BridgeLogo className={styles.heroLogo} />
          </div>
          <Heading as="h1" className={styles.heroTitle}>
            <span className={styles.titleMain}>Move</span>
            <span className={styles.titleAccent}>Bridge</span>
          </Heading>
          <p className={styles.heroTagline}>
            The complete TypeScript SDK for Movement Network
          </p>
          <p className={styles.heroSubtext}>
            Like ethers.js, but for Movement. Unified wallet connection, type-safe contracts, and React-first design.
          </p>
          <div className={styles.buttons}>
            <Link
              className={styles.primaryButton}
              to="/docs/getting-started">
              Get Started
              <span className={styles.buttonArrow}>→</span>
            </Link>
            <Link
              className={styles.secondaryButton}
              to="/docs">
              Documentation
            </Link>
          </div>
          <div className={styles.installCommand}>
            <code>npm install @movebridge/core @movebridge/react</code>
          </div>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: JSX.Element;
  icon: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Unified Wallet Connection',
    icon: '🔗',
    description: (
      <>
        Connect to Razor, Nightly, and OKX wallets with a single, unified API.
        No more dealing with different wallet interfaces.
      </>
    ),
  },
  {
    title: 'Type-Safe Contracts',
    icon: '🛡️',
    description: (
      <>
        Generate TypeScript bindings from deployed Move modules. Get full
        autocomplete and compile-time type checking.
      </>
    ),
  },
  {
    title: 'React-First Design',
    icon: '⚛️',
    description: (
      <>
        Built-in hooks and components for React applications. useMovement,
        useBalance, useContract, and more.
      </>
    ),
  },
  {
    title: 'Comprehensive Testing',
    icon: '🧪',
    description: (
      <>
        Mock clients, fake data generators, and validators. Ship with confidence
        using our testing utilities.
      </>
    ),
  },
  {
    title: 'Structured Errors',
    icon: '🎯',
    description: (
      <>
        Typed error codes for programmatic handling. Know exactly what went wrong
        and how to handle it.
      </>
    ),
  },
  {
    title: 'Event Subscriptions',
    icon: '📡',
    description: (
      <>
        Subscribe to contract events in real-time. Build reactive applications
        that respond to on-chain changes.
      </>
    ),
  },
];

function Feature({ title, icon, description }: FeatureItem) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Everything you need to build on Movement
          </Heading>
          <p className={styles.sectionSubtitle}>
            A complete toolkit designed for developer productivity
          </p>
        </div>
        <div className={styles.featureGrid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CodeExample(): JSX.Element {
  return (
    <section className={styles.codeExample}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Simple, Powerful API
          </Heading>
          <p className={styles.sectionSubtitle}>
            Get started in minutes with intuitive APIs
          </p>
        </div>
        <div className={styles.codeBlocks}>
          <div className={styles.codeBlock}>
            <div className={styles.codeBlockHeader}>
              <span className={styles.codeBlockDot}></span>
              <span className={styles.codeBlockDot}></span>
              <span className={styles.codeBlockDot}></span>
              <span className={styles.codeBlockTitle}>Vanilla TypeScript</span>
            </div>
            <div className={styles.codeBlockContent}>
              <CodeBlock language="typescript">
                {vanillaCode}
              </CodeBlock>
            </div>
          </div>
          <div className={styles.codeBlock}>
            <div className={styles.codeBlockHeader}>
              <span className={styles.codeBlockDot}></span>
              <span className={styles.codeBlockDot}></span>
              <span className={styles.codeBlockDot}></span>
              <span className={styles.codeBlockTitle}>React</span>
            </div>
            <div className={styles.codeBlockContent}>
              <CodeBlock language="tsx">
                {reactCode}
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Packages(): JSX.Element {
  return (
    <section className={styles.packages}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Modular Packages
          </Heading>
          <p className={styles.sectionSubtitle}>
            Use what you need, nothing more
          </p>
        </div>
        <div className={styles.packageGrid}>
          <Link to="/docs/packages/core" className={styles.packageCard}>
            <div className={styles.packageIcon}>📦</div>
            <h3>@movebridge/core</h3>
            <p>Core SDK with wallet management, transactions, and contract interactions</p>
          </Link>
          <Link to="/docs/packages/react" className={styles.packageCard}>
            <div className={styles.packageIcon}>⚛️</div>
            <h3>@movebridge/react</h3>
            <p>React hooks and pre-built components for rapid development</p>
          </Link>
          <Link to="/docs/packages/codegen" className={styles.packageCard}>
            <div className={styles.packageIcon}>⚡</div>
            <h3>@movebridge/codegen</h3>
            <p>CLI tool for generating TypeScript bindings from Move modules</p>
          </Link>
          <Link to="/docs/packages/testing" className={styles.packageCard}>
            <div className={styles.packageIcon}>🧪</div>
            <h3>@movebridge/testing</h3>
            <p>Testing utilities: mocks, fakers, validators, and simulators</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - ethers.js for Movement`}
      description="The complete TypeScript SDK for Movement Network. Unified wallet connection, type-safe contracts, React hooks, and comprehensive testing utilities.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <CodeExample />
        <Packages />
      </main>
    </Layout>
  );
}
