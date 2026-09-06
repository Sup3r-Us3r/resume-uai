#!/usr/bin/env node
import { createProgram } from "./cli.js";

const program = createProgram();

program.parseAsync(process.argv).catch((err) => {
  console.error("Fatal CLI execution error:", err);
  process.exit(1);
});
