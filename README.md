# MetaWalletPlus

MetaWalletPlus is a client-side dashboard for injected EVM wallets. It connects through the standard EIP-1193 provider exposed by wallets such as MetaMask, displays the active network and native balance, tracks ERC-20 balances, and prepares native transfers for explicit wallet review and approval.

Private keys and seed phrases never enter this application.

## Features

- Explicit injected-wallet connection
- Live account, chain, and native-currency balance
- Ethereum, Optimism, BNB Chain, Polygon, Arbitrum, and Base metadata
- Custom ERC-20 discovery through on-chain `name`, `symbol`, `decimals`, and `balanceOf`
- Chain-specific watchlists stored only in browser `localStorage`
- Validated native transfers submitted through the wallet and tracked to confirmation
- Account/network change handling and clear error states

## Run locally

```bash
git clone https://github.com/centxyz/MetaWalletPlus.git
cd MetaWalletPlus
npm install
npm run dev
```

Open the local URL in a browser with a trusted EVM wallet extension. The dashboard does not bundle RPC credentials; it uses the network selected in the wallet.

## Verify

```bash
npm test
npm run build
```

Tests cover transfer validation and wei conversion, token-watchlist isolation and deduplication, and network metadata.

## Safety

MetaWalletPlus does not inspect every smart-contract risk and cannot reverse transactions. Confirm the network, recipient, amount, gas, and final wallet prompt. Never paste a private key or seed phrase into this or any ordinary web application.

## License

MIT © cent
