import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { addWatchedToken, loadToken, networkInfo, validateTransfer } from './wallet.js';
import './App.css';

const short = value => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '';
export default function App() {
  const [session, setSession] = useState({ provider: null, account: '', chainId: 0, balance: '0' });
  const [tokens, setTokens] = useState(() => { try { return JSON.parse(localStorage.getItem('metawallet:tokens')) || []; } catch { return []; } });
  const [assets, setAssets] = useState([]); const [tokenAddress, setTokenAddress] = useState('');
  const [send, setSend] = useState({ to: '', amount: '' }); const [notice, setNotice] = useState({ type: 'idle', text: 'Connect an injected wallet to begin.' });
  const network = networkInfo(session.chainId);
  useEffect(() => localStorage.setItem('metawallet:tokens', JSON.stringify(tokens)), [tokens]);

  const refresh = useCallback(async (provider = session.provider, account = session.account, chainId = session.chainId) => {
    if (!provider || !account) return;
    try {
      const balance = formatEther(await provider.getBalance(account));
      const current = tokens.filter(token => token.chainId === Number(chainId));
      const loaded = await Promise.all(current.map(token => loadToken(provider, token, account).catch(error => ({ ...token, error: error.shortMessage || error.message }))));
      setSession(value => ({ ...value, provider, account, chainId: Number(chainId), balance })); setAssets(loaded);
      setNotice({ type: 'success', text: `Balances refreshed at ${new Date().toLocaleTimeString()}.` });
    } catch (error) { setNotice({ type: 'error', text: error.shortMessage || error.message }); }
  }, [session.provider, session.account, session.chainId, tokens]);

  async function connect() {
    if (!window.ethereum) { setNotice({ type: 'error', text: 'No injected EVM wallet was found. Install a trusted wallet extension.' }); return; }
    try {
      const provider = new BrowserProvider(window.ethereum); const signer = await provider.getSigner(); const account = await signer.getAddress(); const { chainId } = await provider.getNetwork();
      await refresh(provider, account, Number(chainId));
    } catch (error) { setNotice({ type: 'error', text: error.shortMessage || error.message }); }
  }

  useEffect(() => {
    if (!window.ethereum?.on) return undefined;
    const changed = () => window.location.reload(); window.ethereum.on('accountsChanged', changed); window.ethereum.on('chainChanged', changed);
    return () => { window.ethereum.removeListener?.('accountsChanged', changed); window.ethereum.removeListener?.('chainChanged', changed); };
  }, []);

  async function watchToken(event) {
    event.preventDefault();
    try {
      const next = addWatchedToken(tokens, tokenAddress, session.chainId);
      if (next === tokens) setNotice({ type: 'idle', text: 'That token is already watched on this chain.' });
      else {
        const added = next[next.length - 1]; const loaded = await loadToken(session.provider, added, session.account);
        setTokens(next); setAssets(current => [...current, loaded]); setTokenAddress(''); setNotice({ type: 'success', text: `${loaded.symbol} added to this browser.` });
      }
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  async function submitTransfer(event) {
    event.preventDefault();
    if (!session.provider) { setNotice({ type: 'error', text: 'Connect your wallet first.' }); return; }
    try {
      const tx = validateTransfer(send); const signer = await session.provider.getSigner();
      setNotice({ type: 'pending', text: 'Review and confirm the transfer in your wallet.' }); const response = await signer.sendTransaction(tx);
      setNotice({ type: 'pending', text: `Submitted ${response.hash}. Waiting for confirmation…` }); const receipt = await response.wait();
      setNotice({ type: 'success', text: `Confirmed in block ${receipt.blockNumber}: ${response.hash}` }); setSend({ to: '', amount: '' }); await refresh();
    } catch (error) { setNotice({ type: 'error', text: error.shortMessage || error.message }); }
  }

  const totalAssets = useMemo(() => assets.filter(asset => !asset.error).length + (session.account ? 1 : 0), [assets, session.account]);
  return <div className="shell"><header><div className="brand"><i/>META<span>WALLET+</span></div><div className="network"><b/>{session.account ? network.name : 'Wallet offline'}</div><button onClick={connect}>{session.account ? short(session.account) : 'Connect wallet'}</button></header>
    <main><section className="hero"><div><span className="eyebrow">SELF-CUSTODY COMMAND CENTER</span><h1>Your wallet.<br/><em>Your approval.</em></h1><p>Inspect balances and prepare transfers through your injected wallet. Private keys never enter this app.</p></div><div className="balance"><span>NATIVE BALANCE</span><strong>{Number(session.balance).toLocaleString(undefined,{maximumFractionDigits:6})}</strong><small>{network.symbol} · {totalAssets} tracked assets</small></div></section>
      <div className="grid"><section className="panel"><div className="title"><b>01</b><h2>Assets</h2><button className="text" onClick={() => refresh()}>Refresh</button></div>
        {!session.account ? <div className="empty">Connect a wallet to read on-chain balances.</div> : <><div className="asset"><div className="coin">{network.symbol.slice(0,1)}</div><div><b>{network.symbol}</b><small>{network.name} native asset</small></div><strong>{Number(session.balance).toLocaleString(undefined,{maximumFractionDigits:6})}</strong></div>{assets.map(asset => <div className="asset" key={`${asset.chainId}:${asset.address}`}><div className="coin token">{asset.symbol?.slice(0,1)||'?'}</div><div><b>{asset.symbol||short(asset.address)}</b><small>{asset.error||asset.name}</small></div><strong>{asset.error?'Unavailable':Number(asset.formatted).toLocaleString(undefined,{maximumFractionDigits:6})}</strong><button className="remove" aria-label={`Remove ${asset.symbol||asset.address}`} onClick={() => setTokens(current => current.filter(item => !(item.chainId===asset.chainId&&item.address.toLowerCase()===asset.address.toLowerCase())))}>×</button></div>)}</>}
        <form className="watch" onSubmit={watchToken}><label>Watch ERC-20 contract<input value={tokenAddress} onChange={event=>setTokenAddress(event.target.value)} placeholder="0x…" disabled={!session.account}/></label><button disabled={!session.account}>Add token</button></form>
      </section><section className="panel"><div className="title"><b>02</b><h2>Send native currency</h2></div><form className="send" onSubmit={submitTransfer}><label>Recipient<input value={send.to} onChange={event=>setSend({...send,to:event.target.value})} placeholder="0x…"/></label><label>Amount <small>{network.symbol}</small><input value={send.amount} onChange={event=>setSend({...send,amount:event.target.value})} placeholder="0.0" inputMode="decimal"/></label><div className="review"><span>Network</span><b>{network.name}</b><span>From</span><b>{session.account?short(session.account):'Not connected'}</b></div><button className="primary">Review in wallet</button></form></section></div>
      <section className={`notice ${notice.type}`}><i/><pre>{notice.text}</pre></section><p className="warning">Always verify the network, recipient, amount, and wallet prompt. Transactions are irreversible.</p>
    </main></div>;
}
