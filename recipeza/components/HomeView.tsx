import { useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { CornerDownLeftIcon } from "lucide-react";
import { useRecipezaContext } from "@/lib/recipeza-provider";
import { motion } from "framer-motion";
import { useCoAgent } from "@copilotkit/react-core";

const MAX_INPUT_LENGTH = 250;

export function HomeView() {
  const { setRecipezaQuery, recipezaInput, setRecipezaInput } =
    useRecipezaContext();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { run: runRecipezaAgent } = useCoAgent({
    name: "search_agent",
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleColorSchemeChange = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mediaQuery.addEventListener("change", handleColorSchemeChange);
    handleColorSchemeChange(mediaQuery);
    return () =>
      mediaQuery.removeEventListener("change", handleColorSchemeChange);
  }, []);

  const handleRecipeza = (query) => {
    setRecipezaQuery(query);
    runRecipezaAgent(query);
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
      <h1 className="text-6xl font-bold mb-4 ">Recipeza</h1>
      <div
        className={`w-full max-w-xl bg-white shadow-lg rounded-lg overflow-hidden  p-4 ${
          isInputFocused ? "ring-2 ring-primary-500" : ""
        }`}
      >
        <Textarea
          placeholder="Search delicious recipes..."
          className="w-full text-lg p-3 border-none focus:outline-none  "
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          value={recipezaInput}
          onChange={(e) => setRecipezaInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleRecipeza(recipezaInput);
            }
          }}
          maxLength={MAX_INPUT_LENGTH}
        />
        <div className="flex items-center justify-between mt-2">
          <div
            className={`text-sm ${
              recipezaInput ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {recipezaInput.length} / {MAX_INPUT_LENGTH}
          </div>
          <Button
            className={`transition-opacity duration-300 ${
              recipezaInput ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => handleRecipeza(recipezaInput)}
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
            onClick={() => handleRecipeza(suggestion.label)}
            className="bg-gray-200  p-3 rounded-lg cursor-pointer hover:bg-gray-300 -600 transition-colors flex items-center space-x-2"
          >
            <span className="text-2xl">{suggestion.icon}</span>
            <span className="text-lg ">{suggestion.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
