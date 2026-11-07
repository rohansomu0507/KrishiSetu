import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI client if valid API key is present
const rawKey = process.env.GEMINI_API_KEY;
const hasValidKey = rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey.trim().length > 10;
let aiClient: GoogleGenAI | null = null;

if (hasValidKey) {
  aiClient = new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Advisory & Scenario Explanation Endpoint
app.post('/api/advisor/analyze', async (req, res) => {
  try {
    const {
      crop,
      variety,
      quantityTonnes,
      harvestDate,
      originDistrict,
      mandis,
      optimalPlan,
      scenarioModifications,
      language = 'en',
    } = req.body;

    // Check if Gemini API is available
    if (!aiClient) {
      // Deterministic expert agricultural economics fallback response
      return res.json({
        source: 'heuristic-engine',
        status: 'success',
        executiveSummary: `For ${quantityTonnes}T of ${crop} (${variety}) harvested at ${originDistrict}, ${optimalPlan?.strategyHeadline || 'a phased delivery approach'} is recommended. By accounting for transit freight (₹${optimalPlan?.totalFreight?.toLocaleString('en-IN')}) and quality decay risks, this approach yields an expected net realization of ₹${optimalPlan?.totalNetRealization?.toLocaleString('en-IN')}, outperforming a single-day distress sale by ~₹${optimalPlan?.advantageOverImmediateSale?.toLocaleString('en-IN')}.`,
        justification: [
          `Local vs Terminal Market Arbitrage: Terminal markets offer higher gross prices, but freight over distances >150km requires minimum batch sizes of 3T to stay economically feasible.`,
          `Arrival Glut Risk: Monitoring 7-day arrival trends prevents delivering during peak day gluts when local buyer absorption is saturated.`,
          `Perishability & Moisture Loss: Holding beyond day 3 without cold storage incurs severe daily weight and grade discounts, negating speculative price gains.`,
        ],
        stressTests: [
          {
            condition: 'If Diesel Freight increases by +25%',
            impact: 'Local APMC becomes more favorable for batches under 2 tonnes due to reduced transport overhead.',
          },
          {
            condition: 'If Terminal Mandi Arrivals spike +40%',
            impact: 'Spot auction rates will drop by ₹250-₹450/quintal; immediately redirect secondary batch to local processing buyers.',
          },
          {
            condition: 'If Ambient Heat/Rain causes transit delay',
            impact: 'Produce spoilage rate increases to 4.5%/day; prioritize immediate same-day sale at nearest mandi regardless of minor price premium.',
          },
        ],
        actionChecklist: [
          'Pre-book 3-tonne or 5-tonne mini-truck 24 hours prior to harvest to lock in standard freight rates.',
          'Grade and pack produce in ventilated 25kg plastic crates rather than gunny sacks to cut transit spoilage by 60%.',
          'Aim to reach mandi gates before 04:30 AM for early morning commission agent inspection and optimal lot placement.',
          'Monitor the live mandi arrival ticker on harvest eve before final truck dispatch.',
        ],
      });
    }

    const prompt = `You are an expert Agricultural Market Economist and APMC Mandi Harvest Planning Advisor for Indian farmers.
Analyze the following farmer harvest and market forecast data to give a clear, practical, risk-aware recommendation.

FARMER HARVEST CONTEXT:
- Crop: ${crop} (${variety})
- Expected Quantity: ${quantityTonnes} Tonnes (${quantityTonnes * 10} Quintals)
- Harvest Date: ${harvestDate}
- Farm Origin: ${originDistrict}
- Preferred Language: ${language}

COMPETING MANDIS EVALUATED:
${JSON.stringify(mandis, null, 2)}

PROPOSED OPTIMAL ALLOCATION PLAN (BY MATHEMATICAL SOLVER):
${JSON.stringify(optimalPlan, null, 2)}

WHAT-IF SCENARIO ADJUSTMENTS (IF ANY):
${JSON.stringify(scenarioModifications || {}, null, 2)}

Respond with a JSON object containing:
{
  "executiveSummary": "Clear, practical 2-3 sentence executive recommendation explaining when, where, and how much to sell, explicitly stating net in-hand realization versus nearest mandi quick sale.",
  "strategyHeadline": "A short, punchy strategy name (e.g., 'Phased Dispatch: 60% Hub, 40% Local')",
  "justification": [
    "3-4 concrete bullet points explaining why this timing and split beats immediate selling or single-mandi dumping, factoring transport costs, handling, and perishability"
  ],
  "stressTests": [
    {
      "condition": "What happens if freight rates increase +25%?",
      "impact": "Detailed impact on net margins and decision threshold"
    },
    {
      "condition": "What happens if arrivals spike unexpectedly?",
      "impact": "Advice on price depression and alternative routing"
    },
    {
      "condition": "What happens if weather/storage causes rapid quality decay?",
      "impact": "Urgent harvest rescue recommendation"
    }
  ],
  "actionChecklist": [
    "4 actionable steps for the farmer (logistics booking, grading/crates, gate timing, payment risk)"
  ]
}
Format the output as strictly valid JSON. Do not include markdown code block backticks if possible, or ensure it parses cleanly.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // Clean potential backticks
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      source: 'gemini-3.8-flash',
      status: 'success',
      ...parsedData,
    });
  } catch (error: any) {
    console.error('Gemini advisor error:', error);
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Failed to generate advisory',
      fallback: true,
    });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  const fsSync = await import('fs');
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fsSync.existsSync(path.resolve(distPath, 'index.html'));
  const isDev = process.env.NODE_ENV !== 'production' || !hasDist;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for all client-side routes in dev
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        try {
          template = await vite.transformIndexHtml(req.originalUrl, template);
        } catch {
          template = await vite.transformIndexHtml('/', template);
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error('Server HTML delivery error:', e);
        try {
          const fs = await import('fs/promises');
          const staticHtml = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
          res.status(200).set({ 'Content-Type': 'text/html' }).end(staticHtml);
        } catch {
          next(e);
        }
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'), (err) => {
        if (err) {
          res.status(200).sendFile(path.resolve(__dirname, 'index.html'));
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mayura APMC Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
