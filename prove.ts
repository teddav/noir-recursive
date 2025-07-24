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
    circuit_1: loadFileAsJson("./circuit_1/target/circuit_1.json"),
    recurse: loadFileAsJson("./recurse/target/recurse.json"),
  };
}

const CIRCUITS = loadCircuits();

async function prove_UltraHonk() {
  const noir = new Noir(CIRCUITS.circuit_1);
  const backend = new UltraHonkBackend(CIRCUITS.circuit_1.bytecode, { threads: os.cpus().length }, { recursive: true });

  const data = { a: 3, b: 4, c: 12 };

  const { witness } = await noir.execute(data);

  console.time("prove");
  const { proof, publicInputs } = await backend.generateProof(witness);
  const proofAsFields = deflattenFields(proof);
  assert(proofAsFields.length === 456);
  console.timeEnd("prove");

  const barrentenbergApi = await Barretenberg.new({ threads: os.cpus().length });
  const verificationKey = await backend.getVerificationKey();
  const _vkAsFields = await barrentenbergApi.acirVkAsFieldsUltraHonk(new RawBuffer(verificationKey));
  let vkAsFields = _vkAsFields.map((f) => f.toString());
  console.log("VK size:", vkAsFields.length);

  // Recursive circuit
  const noir_recursive = new Noir(CIRCUITS.recurse);
  const backend_recursive = new UltraHonkBackend(CIRCUITS.recurse.bytecode, { threads: os.cpus().length }, { recursive: true });

  const recursiveInputs = {
    verification_key: vkAsFields,
    proof: proofAsFields,
    public_inputs: publicInputs,
  };

  console.time("execute_recursive");
  const { witness: witness_recursive } = await noir_recursive.execute(recursiveInputs);
  console.timeEnd("execute_recursive");

  console.time("prove_recursive");
  const proof_recursive = await backend_recursive.generateProof(witness_recursive);
  console.timeEnd("prove_recursive");

  const verified = await backend_recursive.verifyProof(proof_recursive);
  assert(verified);
  console.log("verified", verified);
}

prove_UltraHonk();
