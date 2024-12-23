"use client";

import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import ContractABI from "@/libs/StylusContractABI.json";

// Smart Contract Configuration
const config = {
  arbitrum_one: {
    chainId: 421614,
    chainName: "Arbitrum Sepolia Testnet",
    contracts: {
      cacheManager: {
        name: "CacheManager",
        // address: "0xCed9cA39eD3105Fc3c88BAbfE2483BC69c861197",
        address: "0x0C9043D042aB52cFa8d0207459260040Cca54253",
        abi: ContractABI.abi,
      },
    },
  },
};

export default function CacheManager() {
  const [cacheSize, setCacheSize] = useState(null);
  const [entries, setEntries] = useState([]);
  const [minBid, setMinBid] = useState(null);
  const [contractAddress, setContractAddress] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize ethers.js Provider
  const getProvider = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      return provider;
    } else {
      throw new Error("MetaMask is not installed");
    }
  };

  // Initialize Contract
  const getContract = async () => {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(
      config.arbitrum_one.contracts.cacheManager.address,
      config.arbitrum_one.contracts.cacheManager.abi,
      signer
    );
  };

  // Fetch Cache Size
  const fetchCacheSize = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const size = await contract.cacheSize();
      setCacheSize(size.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch cache size: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Entries
  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const rawEntries = await contract.getEntries();
      const processedEntries = rawEntries.map((entry) =>
        ethers.isAddress(entry) ? entry : "Invalid entry"
      );
      setEntries(processedEntries);
    } catch (error) {
      setErrorMessage("Failed to fetch entries: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Minimum Bid
  const fetchMinBid = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const min = await contract.getMinBid(contractAddress);
      setMinBid(ethers.formatEther(min.toString()));
    } catch (error) {
      setErrorMessage("Failed to fetch minimum bid: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Place Bidethereum
  const handlePlaceBid = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!ethers.isAddress(contractAddress)) {
        throw new Error("Invalid contract address");
      }

      if (isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
        throw new Error("Bid amount must be greater than zero");
      }

      if (minBid && parseFloat(bidAmount) < parseFloat(minBid)) {
        throw new Error(`Bid amount must be at least ${minBid} ETH`);
      }

      const provider = await getProvider();
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const contract = await getContract();

      const tx = await contract.placeBid(contractAddress, {
        value: ethers.parseEther(bidAmount),
      });

      await tx.wait();
      setSuccessMessage("Bid placed successfully!");

      // Refresh the entries after successful bid
      await fetchEntries();
    } catch (error) {
      console.error(error);
      setErrorMessage(`Failed to place bid: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchCacheSize();
        await fetchEntries();
      } catch (error) {
        console.error("Initialization error:", error);
        setErrorMessage("Failed to initialize: " + error);
      }
    };

    initialize();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Arbitrum Stylus Cache Manager</h1>

      {/* Display Cache Size */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-black">Cache Size</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <p className="text-lg text-black">{cacheSize || "Unavailable"}</p>
        )}
      </div>

      {/* Display Cache Entries */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-black">Cache Entries</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : entries.length > 0 ? (
          <ul className="space-y-2">
            {entries.map((entry, index) => (
              <li key={index} className="font-mono bg-white p-2 rounded">
                {entry}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No entries found.</p>
        )}
        <button
          onClick={fetchEntries}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh Entries"}
        </button>
      </div>

      {/* Place a Bid */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">Place a Bid</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bid Amount (ETH)
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
              step="0.000000000000000001"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={fetchMinBid}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
              disabled={isLoading || !contractAddress}
            >
              {isLoading ? "Fetching..." : "Get Minimum Bid"}
            </button>
            <button
              onClick={handlePlaceBid}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
              disabled={isLoading || !contractAddress || !bidAmount}
            >
              {isLoading ? "Placing Bid..." : "Place Bid"}
            </button>
          </div>

          {minBid && (
            <p className="text-sm text-gray-600">
              Minimum Bid Required: {minBid} ETH
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg mb-4">
          {successMessage}
        </div>
      )}
    </div>
  );
}
