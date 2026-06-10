# DisasterCoord AI — Implementation Plan

**Project:** Disaster Response Coordination Simulator using Multi-Agent Systems & Game Theory
**Course:** Reasoning and Decision Making Under Uncertainty (MAIB DSC 103)
**Institution:** SP Jain School of Global Management, Dubai Campus

---

## 1. Confirmed Dataset Reality (verified against local files)

| Dataset | File | Verified key columns | Role |
|---|---|---|---|
| FEMA Declarations v2 | `DisasterDeclarationsSummaries.csv` | `disasterNumber, state, declarationType, incidentType, ihProgramDeclared, iaProgramDeclared, paProgramDeclared, hmProgramDeclared, incidentBeginDate, incidentEndDate, fyDeclared, region` | PRIMARY — agency mapping + Poisson λ + budgets |
| 911 Calls | `911.csv` | `lat, lng, desc, title, timeStamp, twp` (`title` = `EMS:/Fire:/Traffic:`) | TERTIARY — hourly Poisson λ calibration |
| PA Funded Projects | `PublicAssistanceFundedProjectsDetails.csv` | `projectAmount, federalShareObligated, damageCategoryCode, applicationTitle, incidentType` | SECONDARY — resource budget magnitudes |

**Note:** Real FEMA column names are `ihProgramDeclared / iaProgramDeclared / paProgramDeclared / hmProgramDeclared`
(spec abbreviates them). Notebook uses real names, loads via URL with **local-CSV fallback** so it never crashes.

---

## 2. Deliverables & File List

### Deliverable 1 — Notebook
- `notebook/solution.ipynb` — 32-cell notebook, runnable top-to-bottom in Colab. Generates 17 figures into `images/`.

### Deliverable 2 — React Simulation (`simulation/`)
- Config: `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
- Root: `src/main.tsx`, `src/App.tsx`, `src/index.css`
- `src/types/index.ts` — all TS interfaces
- `src/utils/poissonSampler.ts` — Knuth Poisson + seeded RNG
- Engine: `DisasterEnvironment.ts`, `NashQLearning.ts`, `ShapleyCalculator.ts`, `AHPTOPSISRanker.ts`, `POOMDPBelief.ts`
- `src/data/precomputedQTable.json` — compact pre-trained seed values
- Components: `Navbar`, `Overview`, `Simulation`, `ControlPanel`, `DisasterGrid`, `GameTheory`, `Analytics`, `Methodology`
- Charts: `LearningCurveChart`, `ShapleyChart`, `TOPSISChart`, `BeliefStateChart`, `NashPayoffChart`

### Deliverable 3 — Reports
- `reports/main_report.tex` — 20–25pp Overleaf-ready report
- `reports/ppt_report.tex` — 10-slide NotebookLM source
- NotebookLM prompt (≤500 chars)

### Root
- `requirements.txt`, `images/` (created by notebook at runtime)

---

## 3. Core Classes (mirrored in Python notebook & TS engine)

- **DisasterEnvironment** — 5×5 grid, 5 phases, Poisson incidents, stochastic step, reward fn
- **SingleAgentMDP (T4)** — Value Iteration + Policy Iteration
- **POOMDPAgent (T8)** — Bayesian belief update + particle filter (N=100)
- **NashEquilibriumSolver (T9)** — stage-game payoffs + Iterated Best Response
- **NashQLearningAgent (T10)** — joint Q-table, ε-greedy, Nash-Q update
- **ShapleyValueCalculator (T3)** — exact 3-agent Shapley + coalition values
- **AHPTOPSISRanker (T11)** — AHP eigenvector weights + CR, TOPSIS closeness

---

## 4. Algorithm Order & Dependencies

1. EDA + calibration (λ, budgets) ← data load
2. DisasterEnvironment ← calibration
3. SingleAgentMDP (T4) — Value/Policy Iteration
4. POOMDPAgent (T8) — belief update
5. NashEquilibriumSolver (T9) — stage game + IBR
6. NashQLearningAgent (T10) — training + baselines (random/greedy/single-agent Q)
7. ShapleyValueCalculator (T3) — coalition values
8. AHPTOPSISRanker (T11) — rank 4 strategies on 4 criteria
9. Results, strategy evolution, business interpretation

---

## 5. Technology Choices

- **nashpy** (2-player) + **Iterated Best Response** (3-player, 5³=125 joint actions)
- **Pure NumPy** Value Iteration / belief filter — full transparency
- **React 18 + Vite + TS strict**, **Recharts** (responsive), **Tailwind CDN only**
- State-based page switching (no react-router), seeded RNG, local-CSV fallback

---

## 6. Pitfalls & Mitigations

| Pitfall | Mitigation |
|---|---|
| FEMA real column names differ | Column-resolver accepts both |
| URL download fails in Colab | try/except → local fallback |
| 3-player Nash intractable | IBR (max 1000 iters), mixed fallback |
| Joint Q-table blow-up | 75 states × 5³ actions, sparse dict |
| AHP CR ≥ 0.1 | Auto-adjust + recompute (~0.047) |
| Browser sim lag | 3×3 reduced discretization, memoized useEffect |
| Tailwind CDN missing classes | Custom glassmorphism in `index.css` |
| LaTeX non-standard packages | Restrict to listed packages, manual Harvard `\bibitem` |

---

## 7. Estimated Complexity

| Deliverable | Est. LOC |
|---|---|
| `solution.ipynb` | ~1,400 |
| React simulation | ~3,200 |
| `main_report.tex` | ~900 |
| `ppt_report.tex` | ~350 |
| **Total** | **~5,850** |

---

## 8. Course-Topic → Deliverable Traceability

| Topic | Notebook | Report §4 | React page |
|---|---|---|---|
| T4 MDP/VI | [15] → 5.png | MDP tuple + VI | Analytics |
| T8 POMDP | [17] → 6.png | belief eq | Analytics |
| T9 Nash | [19] → 7.png | IBR algo | Game Theory |
| T10 Nash-Q | [21–22] → 8.png | Nash-Q block | Game Theory / Analytics |
| T3 Shapley | [24] → 9.png | Shapley formula | Game Theory |
| T11 AHP-TOPSIS | [26] → 10.png | AHP + TOPSIS | Analytics |
| Secondary T2/T6/T7 | Poisson arrivals, ε-greedy, single-agent Q | noted | — |

---

## 9. Build Workflow (3 Parts)

- **Part 1:** `notebook/solution.ipynb` — complete, all cells, all figures, all algorithms.
- **Part 2:** React simulation — all files, no TS errors, all controls functional.
- **Part 3:** `main_report.tex` + `ppt_report.tex` + NotebookLM prompt.
