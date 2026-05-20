import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./src/server.ts"],
  format: "esm",
  bytecode: true,
  plugins: [tailwind],
  compile: {
    outfile: "./dist/software-arch",
  },
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
