# MoveBridge Documentation

This is the documentation website for MoveBridge SDK, built with [Docusaurus](https://docusaurus.io/).

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Serve production build locally
npm run serve
```

## Deployment

### Netlify (Recommended)

The documentation is configured for Netlify deployment. There are two ways to deploy:

#### Option 1: Connect via Netlify Dashboard (Easiest)

1. Go to [Netlify](https://app.netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account and select the `MoveBridge` repository
4. Configure build settings:
   - **Base directory**: `docs`
   - **Build command**: `npm run build`
   - **Publish directory**: `docs/build`
5. Click "Deploy site"

Netlify will automatically deploy on every push to main.

#### Option 2: Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# From the docs directory, initialize and deploy
cd docs
netlify init

# Or deploy manually (for testing)
npm run build
netlify deploy --prod --dir=build
```

### Custom Domain

After deployment, you can configure a custom domain in Netlify:
1. Go to Site settings → Domain management
2. Add your custom domain
3. Netlify will automatically provision SSL

### GitHub Pages (Alternative)

```bash
# Deploy to GitHub Pages
npm run deploy
```

## Structure

```
docs/
├── docs/                    # Documentation content
│   ├── intro.md            # Introduction
│   ├── getting-started.md  # Getting started guide
│   ├── guides/             # How-to guides
│   ├── packages/           # Package documentation
│   ├── examples/           # Code examples
│   └── api/                # API reference
├── src/
│   ├── pages/              # Custom pages (homepage)
│   └── css/                # Custom styles
├── static/                 # Static assets
├── docusaurus.config.ts    # Docusaurus configuration
└── sidebars.ts             # Sidebar configuration
```

## Adding Documentation

1. Create a new `.md` file in the appropriate directory
2. Add frontmatter with `sidebar_position` for ordering
3. Update `sidebars.ts` if needed

## License

MIT License - Created by Aqila Rifti
