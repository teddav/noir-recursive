use dep::std::verify_proof;

fn main(
    verification_key: [Field; 128],
    proof: [Field; 456],
    public_inputs: [Field; 2],
    key_hash: Field,
) {
    verify_proof(verification_key, proof, public_inputs, key_hash);
}
