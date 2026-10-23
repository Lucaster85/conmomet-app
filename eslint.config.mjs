import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/common/AppDialog.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@mui/material",
          importNames: ["Dialog"],
          message: "Usar AppDialog de '@/components/common/AppDialog': el Dialog de MUI se cierra al clickear el backdrop y el usuario pierde lo cargado.",
        }],
      }],
    },
  },
];

export default eslintConfig;
