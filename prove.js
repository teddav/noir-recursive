const { UltraHonkBackend } = require("@aztec/bb.js");
const { Noir } = require("@noir-lang/noir_js");
const { assert } = require("console");
const fs = require("fs");
const os = require("os");

const CIRCUITS = {
  circuit_1: JSON.parse(fs.readFileSync("./circuit_1/target/circuit_1.json")),
  recurse: JSON.parse(fs.readFileSync("./recurse/target/recurse.json")),
};

function proofToFields(bytes) {
  const fields = [];
  for (let i = 0; i < bytes.length; i += 32) {
    const fieldBytes = new Uint8Array(32);
    const end = Math.min(i + 32, bytes.length);
    for (let j = 0; j < end - i; j++) {
      fieldBytes[j] = bytes[i + j];
    }
    fields.push(Buffer.from(fieldBytes));
  }
  return fields.map((field) => "0x" + field.toString("hex"));
}

async function prove_UltraHonk() {
  // const { execSync } = require("child_process");
  // execSync("nargo execute --package circuit_1");
  // execSync("nargo compile --package recurse");
  // execSync("bb prove -b ./circuit_1/target/circuit_1.json -w ./circuit_1/target/circuit_1.gz -o ./circuit_1/proof --recursive --honk_recursion 1 --output_format fields");
  // execSync("bb write_vk -b ./circuit_1/target/circuit_1.json -o ./circuit_1/proof --init_kzg_accumulator --honk_recursion 1 --output_format fields");

  const noir = new Noir(CIRCUITS.circuit_1);
  const backend = new UltraHonkBackend(CIRCUITS.circuit_1.bytecode, { threads: os.cpus() }, { recursive: true });

  const data = {
    a: 3,
    b: 4,
    c: 12,
  };

  const { witness } = await noir.execute(data);

  console.time("prove");
  const proof = await backend.generateProof(witness);
  // const { publicInputs, proof: proofAsFields } = await backend.generateProofForRecursiveAggregation(witness);
  console.timeEnd("prove");

  const publicInputsCount = 2;
  const publicInputs = proof.publicInputs.slice(0, publicInputsCount);
  const proofAsFields = [...proof.publicInputs.slice(publicInputsCount), ...proofToFields(proof.proof)];
  assert(proofAsFields.length === 456);

  // This should work, but it seems like it needs to be updated to handle recursive aggregation.
  // https://github.com/AztecProtocol/aztec-packages/blob/d47c74ad5d5789e69b5efbabc01cf3347705ba15/barretenberg/ts/src/barretenberg/backend.ts#L295
  // const { vkAsFields } = await backend.generateRecursiveProofArtifacts(proof, publicInputsCount);

  // so for now, let's just get the values generated with `bb`
  const vkAsFields = JSON.parse(fs.readFileSync("./circuit_1/proof/vk_fields.json"));
  const vkHash = "0x" + "0".repeat(64);

  // VERIFY proof1
  const isValid = await backend.verifyProof(proof);
  assert(isValid);

  // RECURSIVE
  const noir_recursive = new Noir(CIRCUITS.recurse);
  const backend_recursive = new UltraHonkBackend(CIRCUITS.recurse.bytecode, { threads: os.cpus() }, { recursive: true });

  const recursiveInputs = {
    verification_key: vkAsFields,
    proof: proofAsFields,
    public_inputs: publicInputs,
    key_hash: vkHash,
  };

  const { witness: witness_recursive } = await noir_recursive.execute(recursiveInputs);
  console.time("prove_recursive");
  const proof_recursive = await backend_recursive.generateProof(witness_recursive);
  console.timeEnd("prove_recursive");
  const verified = await backend_recursive.verifyProof(proof_recursive);
  assert(verified);
  console.log("verified", verified);
}

prove_UltraHonk();
