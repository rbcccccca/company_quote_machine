import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/company_quote_machine/", // 这里改成你的 repo 名
});
