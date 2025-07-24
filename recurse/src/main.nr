// in bb 1.1.3, the verification key size is 112
// in bb 0.84, the verification key size is 128
global HONK_VK_SIZE: u32 = 112;
global HONK_PROOF_SIZE: u32 = 456;
global HONK_PROOF_TYPE: u32 = 1;

fn main(
    verification_key: [Field; HONK_VK_SIZE],
    proof: [Field; HONK_PROOF_SIZE],
    public_inputs: [Field; 2],
) {
    std::verify_proof_with_type(
        verification_key,
        proof,
        public_inputs,
        0x0000000000000000000000000000000000000000000000000000000000000000,
        HONK_PROOF_TYPE,
    );
}
