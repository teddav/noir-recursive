fn main(verification_key: [Field; 128], proof: [Field; 456], public_inputs: [Field; 2]) {
    std::verify_proof_with_type(
        verification_key,
        proof,
        public_inputs,
        0x0000000000000000000000000000000000000000000000000000000000000000,
        1, // UltraHonk
    );
}
