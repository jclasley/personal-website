---
title: How to use Soft-Serve
date: '2022-12-06'
description: Running a self-hosted git server locally with an eye toward deployment
---

# Table of Contents

1.  [The intro](#orge03a3f9)
2.  [The steps](#org9614939)
    1.  [The code](#orge165c92)
    2.  [The ssh key](#orgdb8631d)
    3.  [Using it](#orgdc13880)
    4.  [Securing it](#org7ebe923)



<a id="orge03a3f9"></a>

# The intro

[Soft Serve](https://github.com/charmbracelet/soft-serve) is powered by [charm](https://charm.sh) and is a tool for self-hosting a git server, accessible via ssh.

This blog won't serve to go into the details of soft serve, but the important points are:

-   You can run it locally or in docker
-   You use SSH to connect to the git server
-   A [bubbletea](https://github.com/charmbracelet/bubbletea) application provides a prettified terminal output

I opted for using a Docker image that has the `soft` binary so that I can run it more easily in a deployed environment (and because Docker is the coolest thing since sliced bread).


<a id="org9614939"></a>

# The steps

Soft Serve provides an example dockerfile, and we are basically going to rip it directly. I chose to use docker-compose, because I used a single docker-compose to serve both my website and the
soft serve git server. The theory is the same whether you use a plain ol' Dockerfile or a docker-compose.


<a id="orge165c92"></a>

## The code

The Soft Serve documentation provides an example `docker-compose.yml` which we are going to use almost verbatim

     1  ---
     2  version: "3.1"
     3  services:
     4    soft-serve:
     5      image: charmcli/soft-serve:latest
     6      container_name: soft-serve
     7      volumes:
     8        - /path/to/data:/soft-serve
     9      ports:
    10        - 23231:23231
    11      restart: unless-stopped

This is a relatively simple docker-compose that spins up a container, mounts over some data, and exposes a port. We're going to change the directory of the
mount volume so that we can easily access the config file that is created on container start.

When we first run this docker compose, it's going to create a config file in the container which, because of the volume mount, will also create the config file in whatever directory we pass.
This directory is also going to end up holding information about your repos, so I would put it somewhere that is easy to remember. I opted for creating a `~/.soft-serve` directory, so
line 8 for me appears as:

    7  volumes:
    8    - ~/.soft-serve:/soft-serve

Feel free to change the port if you want, but for the rest of this blog post I will be using `23231` as the port.


<a id="orgdb8631d"></a>

## The ssh key

Let's generate an ssh key to use for accessing Soft Serve.

    ssh-keygen -t ed25519

That's it. Keep hitting enter. Set a passphrase if you want (but make sure you remember it!) and then you're all done! Congrats. You've just generated a ssh key using the ed25519 signature scheme. Pretty nifty.


<a id="orgdc13880"></a>

## Using it

Using your terminal, navigate to the directory that contains your `docker-compose.yml` and run it with `docker compose up -d`. To verify that it worked and created everything as it should have,
`ls /to/data/repos`, using whatever path you supplied in line 8 of the `docker-compose.yml`. If you followed along with me, that will look like

    ls ~/.soft-serve/repos

You'll know it worked if you see a `config` directory.

Great! Now you have a local git server running, accessible via SSH. Let's make sure we can ssh into it.

    ssh localhost -p 23231

Do you see some repos? Fantastic! Play around in here as much as you want (it's pretty cool) and then hit `q` when you're ready to move on.

Time to push a repo. Navigate to your any project you want to push to Soft Serve. I'm going to assume you already have git initialized, so all you have to do is run the following

    git remote add soft ssh://localhost:23231/<name of your repo>
    git push soft main

There are two ways to verify that it worked. Well, three if you count the output of the command, but I don't trust nobody and need to verify for myself.

    ls ~/.soft-serve/repos

You should see the `config` directory and your newly added repo directory.

    ssh localhost -p 23231

You should see the `config` repo and your newly added repo. Play around! Check out your files. Pretty sweet.


<a id="org7ebe923"></a>

## Securing it

So now you've got a sweet git server running and it wasn't too hard. But what if we deploy this? Anyone could simply ssh into the server and then mess with the config! Worse, they could totally bork
your repos. 

Let's fix that.

First, let's clone down the config.

    git clone ssh://localhost:23231/config

Navigate to the directory, then using your favorite text editor, open up `config.yaml`.

Here's the default config that Soft Serve creates at the time of writing this:

     1  # The name of the server to show in the TUI.
     2  name: Soft Serve
     3  
     4  # The host and port to display in the TUI. You may want to change this if your
     5  # server is accessible from a different host and/or port that what it's
     6  # actually listening on (for example, if it's behind a reverse proxy).
     7  host: localhost
     8  port: 23231
     9  
    10  # Access level for anonymous users. Options are: admin-access, read-write,
    11  # read-only, and no-access.
    12  anon-access: read-write
    13  
    14  # You can grant read-only access to users without private keys. Any password
    15  # will be accepted.
    16  allow-keyless: true
    17  
    18  # Customize repo display in the menu.
    19  repos:
    20    - name: Home
    21      repo: config
    22      private: true
    23      note: "Configuration and content repo for this server"
    24      readme: README.md
    25  
    26  # users:
    27  #   - name: Admin
    28  #     admin: true
    29  #     public-keys:
    30  #       - ssh-ed25519 AAAA... # redacted
    31  #       - ssh-rsa AAAAB3Nz... # redacted
    32  #   - name: Example User
    33  #     collab-repos:
    34  #       - REPO
    35  #     public-keys:
    36  #       - ssh-ed25519 AAAA... # redacted
    37  #       - ssh-rsa AAAAB3Nz... # redacted

We're going to change the `anon-access` on line 12 so that people who are not approved users cannot write to our repos.
For now, let's just give them `read-only` access:

    12  anon-access: read-only

We also want to set ourself as an admin, so that we unequivocally have read-write access to every repo. When ou can we generated our ssh key, it created two files: a public key and a private key.
The first time we connected to the server, we saved its fingerprint (public key) to a file on our system that can typically be found at `~/.ssh/known_hosts`. On any subsequent access,
we verify the server host against its fingerprint in `~/.ssh/known_hosts` &#x2013; if anything has changed, `ssh` freaks out and lets us know. The public and private keys on our machine are used to send
encrypted messages to the server and to decrypt things received from the server, respectively. (Note that this is a very high-level overview. If you want to know more, I'm not your guy. It's very mathy and well beyond the scope of this blog)

The TL;DR is: The server has our public key. It does not have our private key. We send the public key to the server every time. It sends us its public key every time.

We can set the config value of our public key(s) so that the server can verify us and go "hey, that dude's pretty chill. let's give him all the repos."

You can find the value of your public key by `cat ~/.ssh/id_ed25519.pub`, then put that value into the `config.yml`. It will look something like

    26  users:
    27    - name: Admin
    28      admin: true
    29      public-keys:
    30        - <your public key here>

These changes should be the bare minimum to secure your repos. Go ahead and add, commit, push. You can generate another ssh key and try and connect with that key using the `-i` flag on `ssh`
to verify that the second key (that is not associated with an Admin on the `config.yml`) cannot see the config repo.

    ssh -i ~/.ssh/id_rsa localhost -p 23231

