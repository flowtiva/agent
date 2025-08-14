
import { useLocalStorageState } from "./useLocalStorageState";
import { CustomTool } from "../types";

export function useCustomTools() {
  const [customTools, setCustomTools] = useLocalStorageState<CustomTool[]>("customTools", []);

  const addTool = (tool: CustomTool) => {
    setCustomTools((prev) =>
      prev.find((t) => t.declaration.name === tool.declaration.name)
        ? prev
        : [...prev, tool]
    );
  };

  const removeTool = (name: string) => {
    setCustomTools((prev) => prev.filter((t) => t.declaration.name !== name));
  };

  return { customTools, addTool, removeTool };
}