global HONK_VK_SIZE: u32 = 112;
global HONK_PROOF_SIZE: u32 = 456;
global HONK_PROOF_TYPE: u32 = 1;

fn main(
    verification_key: [Field; HONK_VK_SIZE],
    proof: [Field; HONK_PROOF_SIZE],
    // these are the public inputs from `parent1`
    // it's the `random_value` variable
    public_inputs: [Field; 1],
) {
    std::verify_proof_with_type(
        verification_key,
        proof,
        public_inputs,
        0x0000000000000000000000000000000000000000000000000000000000000000,
        HONK_PROOF_TYPE,
    );
}
