import { ethers } from "ethers";
import { ERC20_ABI } from "./erc20";

// Generic ABI for execute(address target, uint256 value, bytes data)
const EXECUTE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "target", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

export async function sendEthExecute(signer, walletAddr, recipient, amountEth) {
  const wallet = new ethers.Contract(walletAddr, EXECUTE_ABI, signer);
  const value = ethers.parseEther(amountEth);
  const tx = await wallet.execute(recipient, value, "0x", { value });
  const receipt = await tx.wait();
  return receipt;
}

// Single, generic ERC-20 path: user pastes token contract, we auto-detect decimals
export async function sendCustomTokenExecute(
  signer,
  walletAddr,
  tokenAddress,
  recipient,
  amountHuman
) {
  // Contract instances
  const wallet = new ethers.Contract(walletAddr, EXECUTE_ABI, signer);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  // Detect decimals on-chain
  const decimals = await token.decimals();

  // Encode transfer(recipient, amount) using correct decimals
  const amount = ethers.parseUnits(amountHuman, decimals);
  const data = token.interface.encodeFunctionData("transfer", [
    recipient,
    amount,
  ]);

  // Call smart wallet execute(token, 0, data)
  const tx = await wallet.execute(tokenAddress, 0n, data, { value: 0n });
  const receipt = await tx.wait();
  return receipt;
}
