import { execFileSync } from "node:child_process";

const run = (command, args) => execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const runs = run("gh", ["run", "list", "--repo", "ab99-c/jarida", "--limit", "5", "--json", "databaseId,status,conclusion,headSha,name,createdAt,updatedAt"]);
console.log("GITHUB_ACTIONS", runs.trim());
const response = await fetch("https://jarida-tan.vercel.app/");
const html = await response.text();
console.log("VERCEL", JSON.stringify({ status: response.status, contentType: response.headers.get("content-type"), htmlBytes: html.length, hasTitle: html.includes("Jarida Live") || html.includes("جريدة الأفق") }));
const asset = html.match(/src=\"([^\"]+\.js)\"/)?.[1];
if (asset) {
  const js = await (await fetch(new URL(asset, "https://jarida-tan.vercel.app/").href)).text();
  const stylesheet = html.match(/href=\"([^\"]+\.css)\"/)?.[1];
  const css = stylesheet ? await (await fetch(new URL(stylesheet, "https://jarida-tan.vercel.app/").href)).text() : "";
  console.log("BUNDLE", JSON.stringify({ asset, stylesheet, hasDuration: js.includes("1400") || css.includes("1400ms"), hasMidpoint: js.includes("700"), hasImmersiveAnimation: css.includes("jarida-immersive-page-turn"), hasPrevAnimation: css.includes("jarida-immersive-page-turn-prev") }));
}
