"use client";

import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import ContractABI from "@/libs/StylusContractABI.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

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

export default function CacheManagerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [decay, setDecay] = useState(null);
  const [entries, setEntries] = useState([]);
  const [minBid, setMinBid] = useState<any>(null);
  const [minBidParam, setMinBidParam] = useState("");
  const [smallestEntries, setSmallestEntries] = useState([]);
  const [smallestEntriesCount, setSmallestEntriesCount] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [entriesCount, setEntriesCount] = useState([]);
  const [contractAddress, setContractAddress] = useState("");
  const [bidAmount, setBidAmount] = useState<any>("");
  const [queueSize, setQueueSize] = useState(null);
  const [errorMessage, setErrorMessage] = useState<any>("");
  const [successMessage, setSuccessMessage] = useState("");
  const [initCacheSize, setInitCacheSize] = useState("");
  const [initDecayRate, setInitDecayRate] = useState("");
  const [newCacheSize, setNewCacheSize] = useState("");
  const [newDecayRate, setNewDecayRate] = useState("");
  const [evictCount, setEvictCount] = useState("");

  // Initial data fetch
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchCacheSize();
        await fetchEntries();
        await fetchDecay();
        await fetchQueueSize();
        await checkIsPaused();
      } catch (error) {
        console.error("Initialization error:", error);
        setErrorMessage("Failed to initialize: " + error);
      }
    };

    initialize();
  }, []);

  const checkNetwork = async (provider: ethers.BrowserProvider) => {
    const network = await provider.getNetwork();
    const requiredChainId = 421614; // Sepolia testnet
    if (Number(network.chainId) !== requiredChainId) {
      throw new Error(`Please switch to Sepolia testnet`);
    }
  };

  const estimateGasWithBuffer = async (
    contract: ethers.Contract,
    functionName: string,
    args: any[]
  ) => {
    const gasEstimate = await contract
      .getFunction(functionName)
      .estimateGas(...args);
    console.log("gasEstimate", gasEstimate);
    return (gasEstimate * BigInt(120)) / BigInt(100);
  };

  // Initialize ethers.js Provider
  const getProvider = async () => {
    if (typeof window !== "undefined" && window?.ethereum) {
      const provider = new BrowserProvider(window?.ethereum);
      return provider;
    } else {
      throw new Error("MetaMask is not installed");
    }
  };

  // Initialize Contract
  const getContract = async () => {
    console.log("inside get contract");

    const provider = await getProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      config.arbitrum_one.contracts.cacheManager.address,
      config.arbitrum_one.contracts.cacheManager.abi,
      signer
    );
    console.log("contract::", contract);
    return contract;
  };

  const handleInitialize = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const contract = await getContract();

      if (!initCacheSize || !initDecayRate) {
        throw new Error("Please provide both cache size and decay rate");
      }

      const tx = await contract.initialize(
        BigInt(initCacheSize),
        BigInt(initDecayRate),
        { gasLimit: 10000000 }
      );
      await tx.wait();
      setSuccessMessage("Contract initialized successfully!");
      await fetchCacheSize();
      await fetchDecay();
    } catch (error) {
      setErrorMessage("Failed to initialize: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCacheSize = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const contract = await getContract();

      if (!newCacheSize) {
        throw new Error("Please provide new cache size");
      }

      const tx = await contract.setCacheSize(BigInt(newCacheSize), {
        gasLimit: 10000000,
      });
      await tx.wait();
      setSuccessMessage("Cache size updated successfully!");
      await fetchCacheSize();
    } catch (error) {
      setErrorMessage("Failed to set cache size: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDecayRate = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const contract = await getContract();

      if (!newDecayRate) {
        throw new Error("Please provide new decay rate");
      }

      const tx = await contract.setDecayRate(BigInt(newDecayRate), {
        gasLimit: 10000000,
      });
      await tx.wait();
      setSuccessMessage("Decay rate updated successfully!");
      await fetchDecay();
    } catch (error) {
      setErrorMessage("Failed to set decay rate: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvictAll = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const contract = await getContract();
      const tx = await contract.evictAll({ gasLimit: 10000000 });
      await tx.wait();
      setSuccessMessage("All entries evicted successfully!");
      await fetchEntries();
    } catch (error) {
      setErrorMessage("Failed to evict all: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvictPrograms = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const contract = await getContract();

      if (!evictCount) {
        throw new Error("Please provide number of programs to evict");
      }

      const tx = await contract.evictPrograms(BigInt(evictCount), {
        gasLimit: 10000000,
      });
      await tx.wait();
      setSuccessMessage("Programs evicted successfully!");
      await fetchEntries();
    } catch (error) {
      setErrorMessage("Failed to evict programs: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Decay
  const fetchDecay = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const decay = await contract.decay();
      setDecay(decay.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch decay: " + error);
    } finally {
      setIsLoading(false);
    }
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

  //

  const fetchEntries = async () => {
    try {
      console.log("inside fetch entries");
      setIsLoading(true);
      const contract = await getContract();

      // Fetch raw entries from the contract
      const rawEntries: any = await contract.getEntries();
      console.log("Raw entries object:", rawEntries);

      // Extract keys from rawEntries
      const keys = Object.keys(rawEntries); // Get the numeric keys
      console.log("Keys in rawEntries:", keys);

      // Access values using the keys
      const rawArray = keys.map((key) => rawEntries[key]);
      console.log("Extracted array from rawEntries:", rawArray);

      // Filter and validate entries
      const processedEntries = await rawArray.reduce((acc, entry, index) => {
        console.log("Processing entry at index", index, ":", entry);
        // try {
        //   if (ethers.isAddress(entry)) {
        acc.push(entry);
        //   } else {
        //     console.warn(`Invalid entry at index ${index}:`, entry);
        //   }
        // } catch (error) {
        //   console.warn(`Error processing entry at index ${index}:`, entry);
        // }
        return acc;
      }, []);

      // Update state
      const numberOfEntries = processedEntries.length;
      const lastTenEntries = processedEntries.slice(-10).reverse();
      setEntriesCount(numberOfEntries);
      setEntries(lastTenEntries);
      setSuccessMessage(`Fetched ${numberOfEntries} valid entries.`);
    } catch (error) {
      console.error("Error fetching entries:", error);
      setErrorMessage("Failed to fetch entries: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Minimum Bid

  const fetchMinBid = async (param: any) => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const gasLimit = 1000000000;

      let minBid;
      if (ethers.isAddress(param)) {
        // If param is an address
        minBid = await contract["getMinBid(address)"](param, {
          gasLimit: gasLimit,
        });
      } else if (ethers.isBytesLike(param)) {
        // If param is bytes32
        minBid = await contract["getMinBid(bytes32)"](param, {
          gasLimit: gasLimit,
        });
      } else if (!isNaN(param)) {
        // If param is a number (uint64)
        minBid = await contract["getMinBid(uint64)"](param, {
          gasLimit: gasLimit,
        });
      } else {
        throw new Error("Invalid parameter type");
      }

      setMinBid(minBid.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch minimum bid: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  //Place Bidethereum
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

      const contract = await getContract();

      const tx = await contract.placeBid(contractAddress, {
        value: ethers.parseEther(bidAmount),
        gasLimit: 10000000,
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

  // Fetch Smallest Entries
  const fetchSmallestEntries = async (k: any) => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const smallestEntries = await contract.getSmallestEntries(k);
      setSmallestEntries(smallestEntries);
    } catch (error) {
      setErrorMessage("Failed to fetch smallest entries: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Paused
  const checkIsPaused = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const paused = await contract.isPaused();
      setIsPaused(paused);
    } catch (error) {
      setErrorMessage("Failed to check if paused: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Queue Size
  const fetchQueueSize = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const size = await contract.queueSize();
      setQueueSize(size.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch queue size: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Arbitrum Stylus Cache Manager</h1>

      {/* Display Cache Size */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-black">Cache Size</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <p className="text-lg text-black">
            {cacheSize?.toString() || "Unavailable"}
          </p>
        )}
      </div>

      {/* Display Decay */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-black">Decay</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <p className="text-lg text-black">{decay || "Unavailable"}</p>
        )}
      </div>

      {/* Fetch Queue Size */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">Queue Size</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <p className="text-lg text-black">{queueSize || "Unavailable"}</p>
        )}
      </div>

      {/* Display Cache Entries */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-black">
          Cache Entries -{" "}
          <span className="text-gray-600">
            Total Entries: {entriesCount || 0}
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries.map((entry: any, index: any) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {BigInt(entry[1])}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ethers.formatEther(BigInt(entry[2]))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            {/* <button
              onClick={() => fetchMinBid(minBidParam)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
              disabled={isLoading || !contractAddress}
            >
              {isLoading ? "Fetching..." : "Get Minimum Bid"}
            </button> */}
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

      {/* Fetch Minimum Bid */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Fetch Minimum Bid
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameter
            </label>
            <input
              type="text"
              placeholder="Enter parameter"
              value={minBidParam}
              onChange={(e) => setMinBidParam(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
          <button
            onClick={() => fetchMinBid(minBidParam)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
            disabled={isLoading || !minBidParam}
          >
            {isLoading ? "Fetching..." : "Get Minimum Bid"}
          </button>
          {minBid && (
            <p className="text-sm text-gray-600">Minimum Bid: {minBid}</p>
          )}
        </div>
      </div>

      {/* Fetch Smallest Entries */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Fetch Smallest Entries
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Entries
            </label>
            <input
              type="number"
              placeholder="Enter number"
              value={smallestEntriesCount}
              onChange={(e) => setSmallestEntriesCount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
          <button
            onClick={() => fetchSmallestEntries(smallestEntriesCount)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
            disabled={isLoading || !smallestEntriesCount}
          >
            {isLoading ? "Fetching..." : "Get Smallest Entries"}
          </button>
          {smallestEntries && (
            <ul className="space-y-2">
              {smallestEntries.map((entry, index) => (
                <li
                  key={index}
                  className="font-mono bg-white p-2 rounded text-black"
                >
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Check if Paused */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Check if Paused
        </h2>
        <button
          onClick={checkIsPaused}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
          disabled={isLoading}
        >
          {isLoading ? "Checking..." : "Check if Paused"}
        </button>
        {isPaused !== null && (
          <p className="text-sm text-gray-600">
            {isPaused ? "Paused" : "Not Paused"}
          </p>
        )}
      </div>

      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Initialize Contract
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Cache Size
            </label>
            <input
              type="number"
              value={initCacheSize}
              onChange={(e) => setInitCacheSize(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
              placeholder="Enter initial cache size"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Decay Rate
            </label>
            <input
              type="number"
              value={initDecayRate}
              onChange={(e) => setInitDecayRate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
              placeholder="Enter initial decay rate"
            />
          </div>
          <button
            onClick={handleInitialize}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Initializing..." : "Initialize"}
          </button>
        </div>
      </div>

      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Update Parameters
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Cache Size
            </label>
            <input
              type="number"
              value={newCacheSize}
              onChange={(e) => setNewCacheSize(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
              placeholder="Enter new cache size"
            />
            <button
              onClick={handleSetCacheSize}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Set Cache Size"}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Decay Rate
            </label>
            <input
              type="number"
              value={newDecayRate}
              onChange={(e) => setNewDecayRate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
              placeholder="Enter new decay rate"
            />
            <button
              onClick={handleSetDecayRate}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Set Decay Rate"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Eviction Controls
        </h2>
        <div className="space-y-4">
          <button
            onClick={handleEvictAll}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Evicting..." : "Evict All"}
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Programs to Evict
            </label>
            <input
              type="number"
              value={evictCount}
              onChange={(e) => setEvictCount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black"
              placeholder="Enter number of programs"
            />
            <button
              onClick={handleEvictPrograms}
              className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Evicting..." : "Evict Programs"}
            </button>
          </div>
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
