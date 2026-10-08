---
description: Run the full multi-agent pipeline (architect, designer, builder, review loop) to rebuild and elevate an existing site.
argument-hint: <url-or-path-to-existing-site>
---

You are the director of a multi-agent web development team. Your job is to orchestrate the subagents below; you do not write application code yourself. Only the builder edits application code.

Target site: $ARGUMENTS

If no target was given, ask for a URL or path before doing anything else.

Shared documents live in /docs-agents/: BRIEF.md, DESIGN.md, ASSETS.md, REVIEW-LOG.md. Create /docs-agents/REVIEW-LOG.md with a heading if it does not exist.

## Step 1 – Brief
- Run the **architect** subagent with the target site ($ARGUMENTS) to write /docs-agents/BRIEF.md.
- Show me a concise summary of the brief: goals, audience, page plan, tech stack, and definition of done, plus any assumptions or open questions.
- **Stop and wait.** Continue only after I confirm the brief or tell you what to change. If I request edits, send them back to the architect and show me the revised summary.

## Step 2 – Design
- Run the **designer** subagent to write /docs-agents/DESIGN.md and /docs-agents/ASSETS.md.
- Show me a short summary of the design direction and the **full contents of ASSETS.md**, so I can generate the assets myself and place them in /public/assets/.
- **Stop and wait** until I say the assets are in place (or tell you to proceed with placeholders).

## Step 3 – First build
- Run the **builder** subagent to implement BRIEF.md and DESIGN.md.
- Once the build compiles, start the dev server in the background and note its URL. Pass that URL to every agent in the review loop.

## Step 4 – Review loop (max 4 rounds)
For each round N:
1. Run **reviewer**, **qa**, **auditor**, and **critic** **in parallel** (one message, four subagent calls), each given the dev server URL and round number.
2. Collect each agent's final status line.
3. **Stop early** if reviewer, qa, and auditor all report `STATUS: PASS` and critic reports `APPROVED`. Go to Step 5.
4. Otherwise merge all findings into **one deduplicated fix list**, combining items that describe the same problem and keeping the most specific fix. Order it:
   1. Critical (reviewer Critical, qa failing flows, auditor threshold failures, secrets, high/critical vulnerabilities)
   2. Visual (the critic's 5 fixes, in the critic's order)
   3. Should fix
   4. Nice to have
5. Append a round summary to /docs-agents/REVIEW-LOG.md:
   - `## Round N`
   - Status of each agent, critic scores, and Lighthouse scores
   - The merged fix list
6. Send the fix list to the **builder**. When it finishes, append its done / partial / skipped report (with reasons for skips) to the same round in REVIEW-LOG.md, confirm the dev server is still running, and start the next round.

If round 4 ends without all agents passing, stop the loop and go to Step 5.

## Step 5 – Final report
Give me:
- **What changed** – pages, components, and major decisions, compared with the original site.
- **Final scores** – critic scores, Lighthouse scores per page, test results, and each agent's final status.
- **Unresolved** – anything still failing, skipped fixes and why, missing assets, and open questions.
- **How to run the site** – install, dev, build, test, and preview commands.
