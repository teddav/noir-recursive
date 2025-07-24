# Recursive circuit in Noir

## bb / nargo

This was last tested with `bb` 1.1.3, and `nargo` 1.0.0-beta.8  
To install these versions:

```bash
bbup -v 1.1.3
noirup -v 1.0.0-beta.8
```

## Run

You only need to compile the circuits, and run `prove.ts`:

```bash
bash compile.sh
npm start
```

## VK size

> [!WARNING]
> depending on the `bb` version used, the VK length is different

in bb 0.84, the verification key's length is 128.  
when updating to 1.1.3, the verification key's length is 112.

Make sure to input the appropriate value in `HONK_VK_SIZE` in [./recurse/src/main.nr](./recurse/src/main.nr)

## Running manually

If you don't like my `prove.ts` script and want to run things with the CLI using `bb`, here's some help

### "child" circuits

First build and prove the circuits that are going to be "recursed".

The proof needs to be in a specific format (an array of 32 bytes field elements).  
`bb` has an option to do it automatically: `--output_format`

```bash
cd circuit_1 && mkdir proof

# compile the circuit and executes it
nargo execute

# generate proof
bb prove -v -s ultra_honk -b "./target/circuit_1.json" -w "./target/circuit_1.gz" -o ./proof --output_format bytes_and_fields --honk_recursion 1 --recursive --init_kzg_accumulator

# generate VK
bb write_vk -v -s ultra_honk -b "./target/circuit_1.json" -o ./proof --output_format bytes_and_fields --honk_recursion 1 --init_kzg_accumulator

bb verify -s ultra_honk -k ./proof/vk -p ./proof/proof -i ./proof/public_inputs
```

In the `proof` directory, the files that are important for us:

- proof_fields.json -> should be an array of 456 values + the number of public inputs
- vk_fields.json -> should be an array of 128 values

#### remove public inputs (bb < 0.84)

> [!WARNING]
> in older versions of `bb`
> You need to remove the public inputs from proof_fields.json

The first value in the proof_fields array should be the public input.  
You need to remove it from the array!  
If there are multiple public inputs, then remove all of them.

In the end, proof_fields's length must be 456.

_You'll actually need to copy the public inputs to the recursive circuit_

**circuit_1 example**  
In our circuit_1, we have 2 public inputs:

- b = 4
- c = 12

So we'll remove the first 2 values which should be:

- 0x0000000000000000000000000000000000000000000000000000000000000004
- 0x000000000000000000000000000000000000000000000000000000000000000c

### recursive circuit

- Copy proof and VK to recurse/Prover.toml
- Adapt the number of public inputs in the recurse circuit: `public_inputs: [Field; 2],`
- Copy public inputs to recurse/Prover.toml

_It seems like `key_hash` should be `0x0000000000000000000000000000000000000000000000000000000000000000` for now. Maybe that will change in the future_

```bash
cd recurse
mkdir proof

nargo execute

bb prove -v -b "./target/recurse.json" -w "./target/recurse.gz" -o ./proof --recursive
bb write_vk -v -b "./target/recurse.json" -o ./proof --honk_recursion 1
bb verify -k ./proof/vk -p ./proof/proof -i ./proof/public_inputs
```
