import { getIndicatorPayload, listIndicators } from "../services/indicatorService.js";

export function listAvailableIndicators(_req, res) {
  res.json(listIndicators());
}

export function calculateIndicator(req, res) {
  res.json({
    data: getIndicatorPayload(req.params.indicatorId, req.query, req.body),
  });
}
