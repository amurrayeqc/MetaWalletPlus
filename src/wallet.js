import { Contract, formatUnits, isAddress, parseEther } from 'ethers';

export const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function symbol() view returns (string)', 'function decimals() view returns (uint8)', 'function name() view returns (string)'];
export const NETWORKS = {
  1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
  10: { name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  56: { name: 'BNB Chain', symbol: 'BNB', explorer: 'https://bscscan.com' },
  137: { name: 'Polygon', symbol: 'POL', explorer: 'https://polygonscan.com' },
  42161: { name: 'Arbitrum One', symbol: 'ETH', explorer: 'https://arbiscan.io' },
  8453: { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org' }
};

export function validateTransfer({ to, amount }) {
  if (!isAddress(to || '')) throw new Error('Recipient is not a valid EVM address');
  let value; try { value = parseEther(String(amount)); } catch { throw new Error('Amount must be a valid native-currency value'); }
  if (value <= 0n) throw new Error('Amount must be greater than zero');
  return { to, value };
}

export function addWatchedToken(tokens, address, chainId) {
  if (!isAddress(address || '')) throw new Error('Token contract is not a valid EVM address');
  const key = `${chainId}:${address.toLowerCase()}`;
  if (tokens.some(token => `${token.chainId}:${token.address.toLowerCase()}` === key)) return tokens;
  return [...tokens, { address, chainId }];
}

export async function loadToken(provider, token, account) {
  const contract = new Contract(token.address, ERC20_ABI, provider);
  const [name, symbol, decimals, balance] = await Promise.all([contract.name(), contract.symbol(), contract.decimals(), contract.balanceOf(account)]);
  return { ...token, name, symbol, decimals: Number(decimals), balance: balance.toString(), formatted: formatUnits(balance, decimals) };
}

export function networkInfo(chainId) { return NETWORKS[Number(chainId)] || { name: `Chain ${chainId}`, symbol: 'NATIVE', explorer: '' }; }
