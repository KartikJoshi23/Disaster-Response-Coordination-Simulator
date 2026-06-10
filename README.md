# DisasterCoord AI — Disaster Response Coordination Simulator

> Multi-agent disaster-response coordination using **game theory** and **reinforcement learning**, calibrated on real FEMA and 911 emergency data.

**Course:** Reasoning and Decision Making Under Uncertainty (MAIB DSC 103)
**Institution:** SP Jain School of Global Management, Dubai

---

## Overview

Three autonomous responder agencies — **Medical**, **Rescue** and **Logistics** —
learn to allocate scarce resources across a city grid under uncertainty. The
project composes six course techniques into a single coordination pipeline and
shows that a learned, game-theoretic policy (**Nash Q-Learning**) outperforms
greedy and random baselines on a transparent multi-criteria decision score.

| Technique | Topic | Where |
|---|---|---|
| Markov Decision Process — Value & Policy Iteration | T4 | notebook + Analytics |
| POMDP — Bayesian belief filtering & particle filter | T8 | notebook + Analytics |
| Nash Equilibrium — Iterated Best Response | T9 | notebook + Game Theory |
| Nash Q-Learning — multi-agent RL | T10 | notebook + Game Theory |
| Shapley Value — fair credit allocation | T3 | notebook + Game Theory |
| AHP-TOPSIS — multi-criteria ranking | T11 | notebook + Analytics |

---

## Headline results (computed, not hard-coded)

| Strategy | Reward | Resp. Time | Utilisation | Fairness | Resolved | **TOPSIS C\*** |
|---|---|---|---|---|---|---|
| **Nash Q-Learning** | 38.16 | 2.49 | 0.535 | **0.526** | 32.7 | **0.681** |
| Cooperative Fixed | 44.57 | 2.32 | 0.535 | 0.458 | 33.2 | 0.651 |
| Greedy | 29.17 | 2.46 | 0.507 | 0.454 | 30.7 | 0.591 |
| Random | 50.68 | 3.48 | 0.663 | 0.535 | 49.9 | 0.373 |

- **Nash Q-Learning ranks #1**, beating Greedy by **+15.2%** on the composite score.
- Statistically significant reward improvement vs Greedy: **t = 11.65, p ≈ 4e-24**.
- **Cooperation evolves upward** during training (1.02 → 3.27 events/episode).
- AHP consistency ratio **CR = 0.000** (< 0.1); Shapley **efficiency axiom verified**.

---

## Live dashboard

The `simulation/` folder is an interactive React + TypeScript dashboard
(dark theme, glassmorphism, live animations) with five views: Overview, Live
Simulation, Game Theory, Analytics and Methodology.

```bash
cd simulation
npm install
npm run dev      # http://localhost:5173
```

### Deploy on Vercel

1. Import this repository on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `simulation`.
3. Framework preset auto-detects **Vite** (build `npm run build`, output `dist`).
4. Deploy — `simulation/vercel.json` handles the rest.

---

## Notebook

`notebook/solution.ipynb` is the full analytical pipeline (32 cells), executed
end-to-end with all **figures embedded** so they render directly on GitHub. It
generates 17 figures into `images/` plus `images/results_table.csv`.

```bash
pip install -r requirements.txt
jupyter notebook notebook/solution.ipynb
```

---

## Data

| Dataset | File | Role |
|---|---|---|
| FEMA Disaster Declarations v2 | `DisasterDeclarationsSummaries.csv` | Agency mapping, Poisson λ, budgets |
| Montgomery County 911 Calls | `911.csv` | Hourly arrival-rate calibration |
| PA Funded Projects | `PublicAssistanceFundedProjectsDetails.csv` | Budget magnitudes (reference) |

> **Note on data files.** The raw CSVs exceed GitHub's 100 MB limit and are
> therefore **git-ignored**. The notebook loads FEMA from the public FEMA API
> URL automatically. The 911 dataset is on
> [Kaggle](https://www.kaggle.com/datasets/mchirico/montcoalert); place `911.csv`
> beside the notebook for exact figures, otherwise the notebook synthesises a
> representative call log so it still runs end-to-end. The committed notebook
> outputs were produced from the real local datasets.

---

## Repository structure

```
.
├── notebook/
│   └── solution.ipynb           # full pipeline, figures embedded
├── simulation/                  # React + TS interactive dashboard
│   ├── src/
│   │   ├── engine/              # DisasterEnvironment, NashQLearning, Shapley, AHP-TOPSIS, POMDP
│   │   ├── components/         # pages + charts (Recharts)
│   │   ├── utils/              # seeded RNG + Poisson sampler
│   │   └── data/               # validated reference metrics
│   └── vercel.json
├── images/                      # generated figures + results_table.csv
├── reports/                     # LaTeX report sources (main + slides)
├── implementation_plan.md
├── requirements.txt
└── README.md
```

---

## License

Released under the [MIT License](LICENSE).
