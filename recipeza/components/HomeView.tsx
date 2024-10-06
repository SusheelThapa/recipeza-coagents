import { useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { CornerDownLeftIcon } from "lucide-react";
import { useResearchContext } from "@/lib/research-provider";
import { motion } from "framer-motion";
import { useCoAgent } from "@copilotkit/react-core";

const MAX_INPUT_LENGTH = 250;

export function HomeView() {
  const { setResearchQuery, researchInput, setResearchInput } = useResearchContext();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { run: runResearchAgent } = useCoAgent({
    name: "search_agent",
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', handleColorSchemeChange);
    handleColorSchemeChange(mediaQuery);
    return () => mediaQuery.removeEventListener('change', handleColorSchemeChange);
  }, []);

  const handleResearch = (query) => {
    setResearchQuery(query);
    runResearchAgent(query);
  };

  const suggestions = [
    { label: "Top recipes for dinner", icon: "🍴" },
    { label: "Healthy breakfast options", icon: "🥑" },
    { label: "Quick lunch recipes", icon: "🍜" },
    { label: "Best dessert discoveries", icon: "🍰" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen w-full flex flex-col gap-y-4 justify-center items-center p-4"
    >
      <h1 className="text-6xl font-bold mb-4 dark:text-gray-100">Recipeza</h1>
      <div
        className={`w-full max-w-xl bg-white shadow-lg rounded-lg overflow-hidden dark:bg-gray-800 p-4 ${isInputFocused ? "ring-2 ring-primary-500" : ""}`}
      >
        <Textarea
          placeholder="Search delicious recipes..."
          className="w-full text-lg p-3 border-none focus:outline-none dark:bg-gray-800 dark:text-gray-100"
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          value={researchInput}
          onChange={(e) => setResearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleResearch(researchInput);
            }
          }}
          maxLength={MAX_INPUT_LENGTH}
        />
        <div className="flex items-center justify-between mt-2">
          <div className={`text-sm ${researchInput ? "text-gray-500" : "text-gray-400"}`}>
            {researchInput.length} / {MAX_INPUT_LENGTH}
          </div>
          <Button
            className={`transition-opacity duration-300 ${researchInput ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => handleResearch(researchInput)}
          >
            Search
            <CornerDownLeftIcon className="ml-2" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xl mt-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.label}
            onClick={() => handleResearch(suggestion.label)}
            className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <span className="text-2xl">{suggestion.icon}</span>
            <span className="text-lg dark:text-gray-200">{suggestion.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
