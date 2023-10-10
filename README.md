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

## How to use

open a terminal (in linux) and go to your desired installation directory

### git the program

`git clone https://github.com/nonki72/logos-ai.git`

### install node version manager && node

[https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

`nvm install 20`

`nvm use 20`

### install mongodb 7.0 community edition

[https://www.mongodb.com/docs/manual/administration/install-on-linux/](https://www.mongodb.com/docs/manual/administration/install-on-linux/)

### install mysql 8.0

[https://dev.mysql.com/doc/refman/8.0/en/linux-installation.html](https://dev.mysql.com/doc/refman/8.0/en/linux-installation.html)

log into mysql as root

`mysql -u root`

create a new database for logos

mysql> `CREATE DATABASE logos;`

and create a dedicated user called 'logos', with full permissions to the 'logos' database

[https://www.digitalocean.com/community/tutorials/how-to-create-a-new-user-and-grant-permissions-in-mysql](https://www.digitalocean.com/community/tutorials/how-to-create-a-new-user-and-grant-permissions-in-mysql)

### install logos-ai

build dependencies with node package manager

`cd logos-ai`

`npm i`

save mysql user credentials

`nano keys/sql.json`

paste the following and fill out the password you set up eariler


```
{
    "user":"logos",
    "pass":"{le password}",
    "db":"logos",
    "host":"127.0.0.1",
    "port":"33060"
}
```

also do this for keys/mongo.json

```
{
    "url": "mongodb://127.0.0.1:27017/"
}
```

and for keys/openai.json

```
{
    "apiKey": "{le api key}"
}
```

and for keys/twitter.json (if you would like twitter functionality)

```
{
    "appKey": "{le app key}",
    "appSecret": "{le app secret}",
    "accessToken": "{le access token}",
    "accessSecret": "{le access secret}"
}
```

now set up the databases!

for mysql

$ `node createTables.js`

if it returns `[]` that's good

and for mongodb

$ `node create_mongo_db.js`

you should see:

```
Database logos created!
Collection Diary created!
Collection Class created!
Collection Module created!
Collection Substitution created!
Collection WordFreq created!
```

if the program hangs after execution, use ctrl-c to close it out (do this for all the node scripts)

now start logos-ai

$ `node app.js`

you will see

```
FP
App listening on port 9001
```

FP is for 'functional programming' which is just a version of the program's main logic rewrite (src/interpreter.js)
you dont need to run anything in (src/) there are runnable scripts for all the functionality in the root directory

### install logos-sensei

open another terminal and go to your git clone root directory

$ `git clone https://github.com/nonki72/logos-sensei.git`

$ `cd logos-sensei`

$ `npm i`

### run the teaching program logos-sensei, so that the student program logos-ai will learn data and functions!

with app.js running in (logos-ai/)

run the following in (logos-sensei/)

$ `node loader.js IoSensei`

this is the first 'sensei' to run

you can actually run them in any order, but some have dependencies on other sensei's

you will see output on the logos-sensei terminal

```
========= Starting Sensei Service 'IoSensei'... =========
Establishing dependencies...
Creating Input/Output functions...
```

and it will wait for input on the other terminal. this must only be done once. all the other sensei's are interactive. this is just to test functionality and may be fully automated in the future

you will see output on the logos-ai terminal

```
!!!!!!!!!!!!!!RUNNING!!!!!!!!!!!!!
Waiting for input...!!!!!!!!!!!!!!OUTPUT!!!!!!!!!!!
[object Promise]

```

type any text and press 'enter'

you will see output on the logos-ai terminal

```
!!!!!!!!!!!!!!CODE EXECUTION!!!!!!!!!!!

console.log(CTX.args.line)
!!!!!!!!!!!CTX!!!!!!!!!!!!!!!
{
    "args": {
        "line": "konnichiwa sekai"
    }
}
!!!!!!!!!!!!!!RUNNING!!!!!!!!!!!!!
konnichiwa sekai
!!!!!!!!!!!!!!OUTPUT!!!!!!!!!!!
undefined
```

you can see where the Logos AI is running some code from the Logos Sensei. it won't run any code from input but it will learn from a sensei

CTX is a variable for holding context

the code is simple here it is writing one line to STDOUT - 'hello world' in japanese romaji

ofter the code has run the AI will then say what the result of the function (code) was, which is undefined as it is the result of `console.log(...)`

you will see output on the logos-sensei terminal

```
========= Sensei Service 'IoSensei' finished. =========
```

you may press ctrl-c on logos-sensei terminal

now run the rest of the sensei's! try AssociationSensei next!! everything that is related logically has an associative value in mysql and is used to implement a relatively compact probablity distribution with real time updates!

if you run the same sensei twice, no worries. they are meant to be idempotent. if you see duplicate data in mongodb, or it gets mucked up for whatever reason, then worst case start over by deleting the tables and start over

$ `node loader.js AssociationSensei`

you will see output in the logos-ai terminal

```
{
  definition1: '6525908c7f724a276a0ef6c8',
  definition2: '6525908c7f724a276a0ef6c7'
}
{
  id: 6525908c7f724a276a0ef6c9,
  type: 'app',
  def1: '6525908c7f724a276a0ef6c8',
  def2: '6525908c7f724a276a0ef6c7',
  invalid: false
}
EC record stored in SQL for equid/astid: 119452/6525908c7f724a276a0ef6c9
Created EC 119452 for 6525908c7f724a276a0ef6c9
EC record stored in SQL for equid/astid: 119452/6525908c7f724a276a0ef6c7
Created EC 119452 for 6525908c7f724a276a0ef6c7
EC record incremented in SQL for equid/astid: 119452/6525908c7f724a276a0ef6c7
```

an association goes from one lambda term (designated by definition id) to another. a term can be an application, an abstraction, or a (free) identifier! that's lambda calculus for ya.

- application: a conjunction of two lambda terms
- abstraction: a function with unfulfilled argument
- identifier: a value (which may be a function)

yes, that means Logos AI is turing complete in its thinking capacity.

associations are stored in the mysql db, where they have an equid, astid, and an assv

- equid: equivalence class identifier (this, together with the astid is UNIQUE)
- astid: abstract syntax tree identifier (the definition/term entry in the mongodb Diary collection 'id' field in mongodb - we are NOT using '_id')
- assv: associative value. how many 'hits' there are on this association (like, have seen or decided this association so many times)

lambda terms are stored in the Diary collection 

the reason it is written in javascript rather than, say, python or haskell is that python and haskell have not as many libraries as JS, and they are not as good for prototyping complex logic, and JS has just about every feature you could want in a language (TypeScript rewrite, anyone???)

you should have already taught the following

- IoSensei (type something in logos-ai terminal and press enter after starting it, so that it will complete)
- AssociationSensei

now run all the remaining sensei's

- NativeSensei
- GrammarSensei
- DataTypeSensei
- TwitterSensei (optional)
- OpenAiSensei
- EdgeGloveFuncSensei
- EdgeGloveCorpSensei
- SpacySensei
- HatsuneMikuSensei 
- WordFreqFuncSensei 
- WordFreqCorpSensei60k -OR- WordFreqCorpSensei219k
- WordnetSensei

some of these have args so check the output first lines for instructions

such one is hatsune miku (no official affiliation with crypton media inc)

run it like this

`node loader.js HatsuneMikuSensei 100 1500`

the first arg is how many lines to train the Neural Network with (these are hatsune miku lyrics and they come with the source)

the second arg is how many iterations and it takes quite a few to predict next word sensibly

the third arg is override the default location of the outputted training data (which is fed directly to logos-ai by the trainer. you do not need this file after running the sensei, besides if you want to load one that's already computed! use (`logos-ai/hatsune-read.js` NOT `loader.js HatsuneMikuSensei`)

the point of this is to add personality to the AI, it was originally envisioned to be hatsune miku herself, however, you can use any lines of text if you edit (src/sensei/hatsunemiku.js) or even (corpus/hatsune_miku_lyrics_4k.txt)

ALSO, WordnetSensei takes a long time so if it fails at some point, simply take the number of the last learned word (strikethrough or not) and use that as the arg like so `node loader.js WordnetSensei 7777` and it will resume from there (by skipping)

## interact with Logos AI

there are several scripts you can use to make use of your newly minted "conscious" AI. it is self aware by definition because of things like NativeSensei, it has the ability to peer into its own mind, and make changes. This will become more and more apparent as more logical functionality is implemented

`node combine.js`

and it will wake

by this it means thinking, and as part of that, any functions it knows may be called. so it could make lots of API calls. these are disabled by default so that it can think to itself. but to enable that, go to (src/interpreter.js) which is its 'main brain' and search for 'readlineInputLine' you'll see the blacklisted functions around line 90. simply comment out those if statements as desired functionality goes

again, if you do this it will start spontaneously tweeting etc. how often, depends on the associative value of TwitterTweet, which begins at 1 and increases every time it is used.

another thing you can do is generate a tweet. for this you need both twitter.json and openai.json filled out properly

`node generate.js`

wait for a few seconds and then it will eihter error (because you didnt pay for openai -- local version coming soon!!) or you're not online.

then press 'y' to tweet it or 'n' to discard. simple as that.

how are these generated? its a hand-held process that uses all the things that logos-ai knows pretty much, and its history. basically it uses a never-before-seen Context Free Grammar of the English language (yaml/) directory and uses wordnet part of speech library (already in mongo) as well as a text file list of the remainder under (text/) directory. i did not create these from scratch but they are curated from the web. nowe, with the CFG being randomly determined from 'S' or sentence, its a skeleton of a sentence. then, the Parts of Speech are appropriately filled in probabilistically based on Word Frequency. Right now WordFreq is its own database, someday to be subsumed into the Diary as WordNet words (although they are synced - there are no words in the WordFreq collection that are not in the Diary). also, lemmas are not known and Logos AI does not know how to handle them right now. it is on the todo-list
