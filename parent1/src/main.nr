// in bb 1.1.3, the verification key size is 112
// in bb 0.84, the verification key size is 128
global HONK_VK_SIZE: u32 = 112;
global HONK_PROOF_SIZE: u32 = 456;
global HONK_PROOF_TYPE: u32 = 1;

fn main(
    verification_key: [Field; HONK_VK_SIZE],
    proof: [Field; HONK_PROOF_SIZE],
    // these are the public inputs from `child`
    // it's the `b` and `c` variables
    public_inputs: [Field; 2],
    // just for fun, let's add some value to our circuit
    random_value: pub u8,
) {
    std::verify_proof_with_type(
        verification_key,
        proof,
        public_inputs,
        0x0000000000000000000000000000000000000000000000000000000000000000,
        HONK_PROOF_TYPE,
    );

    assert(random_value > 10);
}
