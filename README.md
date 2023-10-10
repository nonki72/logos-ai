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
