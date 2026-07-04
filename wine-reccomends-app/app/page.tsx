'use client';

import { useEffect, useState } from "react";

import { WineRecommendationService, Recommendation, GENERAL_KEYS } from "./utils/recommendation-engine";
import { transformFullListOfNodes } from "./utils/transformFullListOfNodes";
import knowledge_base from '../public/knowledge_base.json';


const redWineEngine = new WineRecommendationService(knowledge_base, GENERAL_KEYS.RED);
const whiteWineEngine = new WineRecommendationService(knowledge_base, GENERAL_KEYS.WHITE);
const fullListOfCategoriesForUI = transformFullListOfNodes(knowledge_base, redWineEngine.getCleanName)


export default function Home() {
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [wineType, setWineType] = useState<GENERAL_KEYS>(GENERAL_KEYS.RED);
  const [wineEngine, setWineEngine] = useState<WineRecommendationService>(redWineEngine);

  useEffect(() => {
    if (wineType === GENERAL_KEYS.RED)
      setWineEngine(redWineEngine)
    else if (wineType === GENERAL_KEYS.WHITE)
      setWineEngine(whiteWineEngine)
  }, [wineType]);

  // Fetch new recommendations whenever the selected node changes
  useEffect(() => {
    if (targetNode) {
      const results = wineEngine.getRecommendations(targetNode, 5);
      setRecommendations(results);
    } else {
      setRecommendations([]);
    }
  }, [targetNode, wineType]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-3xl font-bold tracking-tight text-red-700 dark:text-red-500">
            Wine Knowledge Representation Project
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Select a wine component parameter to trigger the graph-based reasoning system.
          </p>
        </header>

        {/* Toggle between Red and White */}
        <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setWineType(GENERAL_KEYS.RED)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${wineType === GENERAL_KEYS.RED
              ? 'bg-white text-red-700 shadow-sm dark:bg-zinc-900 dark:text-red-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
          >
            Red Wine Graph
          </button>
          <button
            type="button"
            onClick={() => setWineType(GENERAL_KEYS.WHITE)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${wineType === GENERAL_KEYS.WHITE
              ? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
          >
            White Wine Graph
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Radio button panels grouped by category */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Wine Components Configuration</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(fullListOfCategoriesForUI).map(([category, items]) => (
                <div
                  key={category}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Category Title (formatted cleanly) */}
                  <h3 className="mb-3 font-medium capitalize text-zinc-700 dark:text-zinc-300">
                    {category.replace(/_/g, ' ')}
                  </h3>

                  {/* Radio Group Options */}
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <label
                        key={item.fullName}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <input
                          type="radio"
                          name={category}
                          value={item.fullName}
                          checked={targetNode === item.fullName}
                          onChange={() => setTargetNode(item.fullName)}
                          className="h-4 w-4 border-zinc-300 text-red-600 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <span className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
                          {item.prefix}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Reasoning Engine Output & Recommendations */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Reasoning Output</h2>

            <div className="sticky top-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {targetNode ? (
                <div>
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Active Node
                    </span>
                    <div className="mt-1 inline-block rounded-md bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                      {targetNode}
                    </div>
                  </div>

                  <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Top Recommendations
                  </h3>

                  {recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.nodeId}
                          className="flex flex-col rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              {rec.nodeId}
                            </span>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                              {rec.score}%
                            </span>
                          </div>

                          {/* Dynamic description based on the connection type */}
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {rec.type === 'direct' ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                ✓ Strong direct correlation
                              </span>
                            ) : (
                              <span>
                                ℹ Alternative path via{" "}
                                <strong className="text-zinc-700 dark:text-zinc-300">
                                  {rec.viaNode}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-zinc-400">
                      No matching relations found for this parameter.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <p className="text-sm text-zinc-400">
                    Select any parameter from the configuration layout to see structural graph recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wine Type Selector Buttons & Graph Visualization */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Graph Visualization
        </h3>

        {/* Image Container */}
        <div className="flex justify-center relative overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
          <img
            src={wineType === GENERAL_KEYS.RED ? '/semantic_network_red.png' : '/semantic_network_white.png'}
            width={1200}
            alt={`${wineType} wine semantic network graph`}
            className="h-auto object-contain rounded transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
}