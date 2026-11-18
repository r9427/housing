import { EstimatorWorkspace } from "@/components/estimator-workspace";
import { estimatorUrl, mlUrl, readJson } from "@/lib/server-api";
import type { Estimate, ModelInfo } from "@/lib/types";

export const metadata = { title: "Value estimator" };

export default async function EstimatorPage() {
  const [model, history] = await Promise.all([
    readJson<ModelInfo>(`${mlUrl()}/model-info`),
    readJson<Estimate[]>(`${estimatorUrl()}/estimates`),
  ]);

  return (
    <EstimatorWorkspace
      model={model.ok ? model.data : null}
      modelError={model.ok ? null : model.error}
      initialHistory={history.ok ? history.data : []}
      historyError={history.ok ? null : history.error}
    />
  );
}
