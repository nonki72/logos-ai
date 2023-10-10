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

### get the program

`git clone https://github.com/nonki72/logos-ai.git`

### get the teacher program

`git clone https://github.com/nonki72/logos-sensei.git`

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
