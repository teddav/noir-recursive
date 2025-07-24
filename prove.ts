import { Barretenberg, deflattenFields, RawBuffer, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/noir_js";
import { assert } from "console";
import { readFileSync } from "fs";
import os from "os";

function loadFileAsJson(path: string) {
  const file = readFileSync(path);
  return JSON.parse(new TextDecoder().decode(file));
}

function loadCircuits(): Record<string, CompiledCircuit> {
  return {
    child: loadFileAsJson("./child/target/child.json"),
    parent1: loadFileAsJson("./parent1/target/parent1.json"),
    parent2: loadFileAsJson("./parent2/target/parent2.json"),
  };
}

const CIRCUITS = loadCircuits();

type Witness = Uint8Array<ArrayBufferLike>;

async function executeCircuit(
  circuit: CompiledCircuit,
  data: Record<string, any>
): Promise<{ witness: Witness; backend: UltraHonkBackend; verificationKey: string[] }> {
  const noir = new Noir(circuit);
  const { witness } = await noir.execute(data);

  const backend = new UltraHonkBackend(circuit.bytecode, { threads: os.cpus().length }, { recursive: true });

  const barrentenbergApi = await Barretenberg.new({ threads: os.cpus().length });
  const verificationKey = await backend.getVerificationKey();
  const _vkAsFields = await barrentenbergApi.acirVkAsFieldsUltraHonk(new RawBuffer(verificationKey));
  const vkAsFields = _vkAsFields.map((f) => f.toString());

  return { witness, backend, verificationKey: vkAsFields };
}

async function main() {
  const {
    witness: witness_child,
    backend: backend_child,
    verificationKey: vkAsFields_child,
  } = await executeCircuit(CIRCUITS.child, { a: 3, b: 4, c: 12 });

  console.time("prove child");
  const proof_child = await backend_child.generateProof(witness_child);
  const proofAsFields_child = deflattenFields(proof_child.proof);
  assert(proofAsFields_child.length === 456);
  console.timeEnd("prove child");
  console.log("Child public inputs:", proof_child.publicInputs);

  // Recursive circuit 1
  const {
    witness: witness_recursive1,
    backend: backend_recursive1,
    verificationKey: vkAsFieldsRecursive1,
  } = await executeCircuit(CIRCUITS.parent1, {
    verification_key: vkAsFields_child,
    proof: proofAsFields_child,
    public_inputs: proof_child.publicInputs,
    random_value: 11,
  });

  console.time("prove recursive 1");
  const proof_recursive1 = await backend_recursive1.generateProof(witness_recursive1);
  const proofAsFields_recursive1 = deflattenFields(proof_recursive1.proof);
  assert(proofAsFields_recursive1.length === 456);
  console.timeEnd("prove recursive 1");
  console.log("Parent 1 public inputs:", proof_recursive1.publicInputs);

  const verified_recursive1 = await backend_recursive1.verifyProof(proof_recursive1);
  assert(verified_recursive1);

  // Recursive circuit 2
  const {
    witness: witness_recursive2,
    backend: backend_recursive2,
    verificationKey: vkAsFieldsRecursive2,
  } = await executeCircuit(CIRCUITS.parent2, {
    verification_key: vkAsFieldsRecursive1,
    proof: proofAsFields_recursive1,
    public_inputs: proof_recursive1.publicInputs,
  });

  console.time("prove recursive 2");
  const proof_recursive2 = await backend_recursive2.generateProof(witness_recursive2);
  console.timeEnd("prove recursive 2");
  console.log("Parent 2 public inputs:", proof_recursive2.publicInputs);

  const verified2 = await backend_recursive2.verifyProof(proof_recursive2);
  assert(verified2);
}

main();
