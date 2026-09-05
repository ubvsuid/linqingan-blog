export interface TickLabExperimentIdentity {
  experimentId: `experiment_${string}`;
  key: "creep-transfer" | "spawn-creep" | "cpu-bucket";
  componentPath: string;
}

export const tickLabExperiments = [
  {
    experimentId: "experiment_1d0e6ab9-bbd8-41c8-8b99-38ffb2dca0cb",
    key: "creep-transfer",
    componentPath: "src/components/tick-lab/transfer-experiment.tsx",
  },
  {
    experimentId: "experiment_fc3dc347-d2cf-40cc-86c5-334ba4ab9a6a",
    key: "spawn-creep",
    componentPath: "src/components/tick-lab/spawn-creep-experiment.tsx",
  },
  {
    experimentId: "experiment_07cfce9c-29f9-4466-bc54-bd33f67b889b",
    key: "cpu-bucket",
    componentPath: "src/components/tick-lab/cpu-bucket-experiment.tsx",
  },
] as const satisfies readonly TickLabExperimentIdentity[];

export type TickLabExperimentKey = (typeof tickLabExperiments)[number]["key"];
