import typographfy from "npm:@tailwindcss/typography";
import { type Config } from "tailwindcss";

export default {
  content: ["{routes,islands,components}/**/*.{ts,tsx}"],
  plugins: [typographfy],
} as Config;
