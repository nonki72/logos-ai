"""
Copyright (C) 2018 Ridgeback Network Defense, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import time
from dwave.system.samplers import DWaveSampler
from neal import SimulatedAnnealingSampler
from dwave.system.composites import EmbeddingComposite

useQpu = False   # change this to use a live QPU
rngSize = 64

# At the top of this file, set useQpu to True to use a live QPU.
if (useQpu):
    sampler = DWaveSampler()
    # We need an embedding composite sampler because not all qubits are
    # working. A trivial embedding lets us avoid dead qubits.
    sampler = EmbeddingComposite(sampler)
else:
    sampler = SimulatedAnnealingSampler()

# Initialize a binary quadratic model.
# It will use 2000 qubits. All biases are 0 and all couplings are 0.
bqm = {}       # binary quadratic model

bqm[(0,0)] = 0  # indicate a qubit will be used

response = sampler.sample_qubo(bqm, num_reads=rngSize)

randStr = ""
# This is a very slow, brute force nested loop.
for datum in response.data():  # for each series of flips
    n = 0
    for key in datum.sample:   # count how many heads or tails
        if (datum.sample[key] == 1):
            randStr += '1'
        else:
            randStr += '0'
rand = int(randStr,2)

print(rand)


