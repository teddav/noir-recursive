#! /bin/bash

cd child
nargo compile
cd ../parent1
nargo compile
cd ../parent2
nargo compile