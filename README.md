# logos
Associative interactive recursive structures

"AI bot" based on linguistics and cognitive science, principles of Lambda Calculus and Haskell. It is a bot that is taught by loading data corpus into its native data format of λ identifiers, abstractions, applications, substitutions, as well as associations among these. It then thinks by selecting a fragment from the database and then if its a function select arguments or if its a value select a function. Then it runs that function and continues this process on
the result. For example, once taught a function that can read a line of input and a function that makes
a Twitter API call for tweeting, the bot can choose to prompt the user for input word and then decide
to tweet it, or read the word from the database then find a synonym and tweet that instead. Basically,
this project is meant to make the computer conscious.

Associative "AI" that is not artificial where everything learned is essentially a lambda calculus primitive so as to blur the line between code and data. If data (such as wordnet synonym sets) can be translated into functional-programming code, then the "AI" can become considerably less complicated, since everything is now described in terms of functions/values, abstractions & applications, and a the log of substitutions made. Functions can be selected filtered by signature, then applied with selected arguments of the proper type, all drawn from a single nosql database. The SQL is used for what I called Equivalence Classes, keeping tally of transformations made given a lambda expression, and creating a probability distribution from which to stochastically draw data based on these associative values (reinforcement learning). Reference materials include books like I-Language: An Introduction to Linguistics as Cognitive Science, and Learn you a Haskell for great good. What i ended up with is a "bot" that is not sandboxed or dependent on libraries for every functionality. For example, by teaching once a simple API function call that can search the web, it suddenly becomes fully connected to all the other things it has learned. In other words, the data/code is flat rather than siloed.

Uses lambda calculus interpreter:
https://github.com/tadeuzagallo/lc-js