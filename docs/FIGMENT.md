# Figment

A `figment` is a class that will extend from a creep. `Figments` will be created every tick. A `figment` will have a list of `neurons` (tasks) that it is trying to accomplish that were pushed by a `thought`.

## Neuron

A `neuron` is a class that will execute a given action against a target and ensure criteria are met. An `interneuron` will be the serialized form of a `neuron` and stored in the `figments` memory.
