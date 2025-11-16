import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

export async function connectWallet(projectId, chainId) {
  if (!projectId || !projectId.trim()) {
    throw new Error("WalletConnect Project ID is required. Get one at https://cloud.walletconnect.com");
  }

  const providerWC = await EthereumProvider.init({
    projectId,
    chains: [chainId],
    showQrModal: true
  });

  await providerWC.connect();

  let provider;
  try {
    provider = new ethers.BrowserProvider(providerWC);
  } catch {
    provider = new ethers.providers.Web3Provider(providerWC);
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}
