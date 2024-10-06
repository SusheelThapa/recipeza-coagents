import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type RecipezaContextType = {
  recipezaQuery: string;
  setRecipezaQuery: (query: string) => void;
  recipezaInput: string;
  setRecipezaInput: (input: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  recipezaResult: RecipezaResult | null;
  setRecipezaResult: (result: RecipezaResult) => void;
};

type RecipezaResult = {
  answer: string;
  sources: string[];
}

const RecipezaContext = createContext<RecipezaContextType | undefined>(undefined);

export const RecipezaProvider = ({ children }: { children: ReactNode }) => {
  const [recipezaQuery, setRecipezaQuery] = useState<string>("");
  const [recipezaInput, setRecipezaInput] = useState<string>("");
  const [recipezaResult, setRecipezaResult] = useState<RecipezaResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!recipezaQuery) {
      setRecipezaResult(null);
      setRecipezaInput("");
    }
  }, [recipezaQuery, recipezaResult]);

  return (
    <RecipezaContext.Provider
      value={{
        recipezaQuery,
        setRecipezaQuery,
        recipezaInput,
        setRecipezaInput,
        isLoading,
        setIsLoading,
        recipezaResult,
        setRecipezaResult,
      }}
    >
      {children}
    </RecipezaContext.Provider>
  );
};

export const useRecipezaContext = () => {
  const context = useContext(RecipezaContext);
  if (context === undefined) {
    throw new Error("useRecipezaContext must be used within a RecipezaProvider");
  }
  return context;
};