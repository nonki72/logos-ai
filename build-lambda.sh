#!/bin/bash
cd src/LambdaInterpreter
ghc -main-is Lambda -outputdir ../../bin Lambda.hs
mv Lambda ../../bin
