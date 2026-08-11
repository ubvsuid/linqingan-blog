import Link from "next/link";

import { Container } from "@/components/container";
import { ScreepsErrorDiagnosticNetwork } from "@/components/screeps-error-diagnostic-network";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { getScreepsErrorDiagnostic } from "@/lib/screeps-error-diagnostics";

import styles from "../english.module.css";

export const revalidate = 300;

export const metadata = createEnglishPageMetadata({
  title: "Screeps Error Codes and Return Values",
  description:
    "A practical English Screeps return-code reference with diagnostic paths connecting high-frequency errors to APIs, object hubs, guides, tools, and accepted runtime verification.",
  path: "/en/screeps-errors",
  chinesePath: "/screeps-errors",
});

const errorCodes = [
  ["OK", "0", "The command was accepted. The visible result may still appear on a later tick."],
  ["ERR_NOT_OWNER", "-1", "The object is not controlled by you, or the method requires ownership."],
  ["ERR_NO_PATH", "-2", "No route or path could be found under the current movement options."],
  ["ERR_NAME_EXISTS", "-3", "A requested name is already in use, commonly when spawning a Creep."],
  ["ERR_BUSY", "-4", "The object is already performing an incompatible action, such as a busy Spawn."],
  ["ERR_NOT_FOUND", "-5", "The requested object, resource, reaction, or state was not found."],
  ["ERR_NOT_ENOUGH_RESOURCES", "-6", "The action lacks the specific resource required by the current method."],
  ["ERR_NOT_ENOUGH_ENERGY", "-6", "A legacy Energy-focused name for the same numeric result; check the current method's documented resource requirement."],
  ["ERR_INVALID_TARGET", "-7", "The target exists but cannot be used by this method."],
  ["ERR_FULL", "-8", "The target store, structure, or capacity is already full."],
  ["ERR_NOT_IN_RANGE", "-9", "The acting object is too far from the target. Move closer and retry on a later tick."],
  ["ERR_INVALID_ARGS", "-10", "One or more arguments do not match the method contract."],
  ["ERR_TIRED", "-11", "The object is on cooldown or a Creep has fatigue."],
  ["ERR_NO_BODYPART", "-12", "The Creep lacks an active body part required for the action."],
  ["ERR_RCL_NOT_ENOUGH", "-14", "The room Controller level does not permit the requested structure or action."],
  ["ERR_GCL_NOT_ENOUGH", "-15", "The account does not have enough control level for the requested claim or expansion."],
] as const;

export default function EnglishScreepsErrorsPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Error Codes</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">RETURN CODE REFERENCE</p>
          <h1>Screeps error codes</h1>
          <p>
            Save and inspect the return value of every important game action. A return code identifies the first failure branch; the diagnostic paths below continue from that branch into the relevant API, object hub, guide, tool, and later-tick verification workflow.
          </p>
        </header>

        <ScreepsErrorDiagnosticNetwork locale="en" />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Constant</th><th>Value</th><th>Practical meaning</th><th>Next</th></tr></thead>
            <tbody>
              {errorCodes.map(([name, value, meaning]) => {
                const diagnostic = getScreepsErrorDiagnostic(name);
                return (
                  <tr key={name} id={name.toLowerCase()}>
                    <td><code>{name}</code></td>
                    <td><code>{value}</code></td>
                    <td>{meaning}</td>
                    <td>{diagnostic ? <Link href={`#diagnostic-${name.toLowerCase()}`}>Diagnostic path ↑</Link> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className={`${styles.grid} ${styles.referenceCardGrid}`}>
          <article className={styles.card}>
            <p className="eyebrow">DEBUGGING PATTERN</p>
            <h2>Store the result once</h2>
            <p>Call the action once, save its result, log the result with context, and branch from that value. Avoid calling the same state-changing method repeatedly inside one expression.</p>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">NEXT STEP</p>
            <h2>Check the full room state</h2>
            <p>When several systems fail together, use a room snapshot to inspect workforce, Energy, Controller pressure, construction, and CPU.</p>
            <Link href="/en/tools/room-diagnostics">Open room diagnostics →</Link>
          </article>
        </section>
      </Container>
    </main>
  );
}
