---
title: Let's talk about channels
date: '2023-04-07'
description: "Go's concurrency primitive can be daunting for newbies, but let's talk about how to make it easier to digest"
---

<p className="prereqs"><span className="label">📖</span> This blog post assumes a working knowledge of goroutines <span className="label">📖</span></p>

-  [What are channels?](#org9cc1680)
-  [Unbuffered vs. buffered channels](#orgd5740ee)
    -  [Unbuffered](#org515cc44)
    -  [Buffered](#orgcdc7ac0)
    -  [Which one to choose](#org9ec1d7a)
-  [Closing](#orgf635c2e)
-  [Ranging over channels](#org70eefce)
    -  [How it works](#orgeef73cb)
-  [Select](#orga58d5f9)
-  [Putting it all together](#org2bc0f59)

One of the reasons I enjoy writing Go code so much is that concurrency is baked into the language, with the expectation that Go developers will be using goroutines and channels often.
However, channels were not an easy topic for me to understand as a new Go developer, especially coming from a JavaScript background. The good news for you, the reader, is that you can learn
from my struggles and hopefully not be doomed to repeat them!


<a id="org9cc1680"></a>

# What are channels?

The definition of channels from the [Tour of Go section](https://go.dev/tour/concurrency/2) is <em>"a typed conduit through which you can send and receive values with the channel operator, <-"</em> which is all well and fine, but what does that actually mean?
Well, it means that we can make a channel, send it some values, then get some values out of it. Sending and receiving are separate operations and can happen anywhere in our code.

Essentially, channels are a nifty tool to allow for asynchronous passage of information. Sending and receiving values via a channel can happen *anywhere* in the codebase!


<a id="orgd5740ee"></a>

# Unbuffered vs. buffered channels

First, we'll start with how to define unbuffered and buffered channels.

    unbufferedChannel := make(chan int)
    bufferedChannel := make(chan int, 1)

Pretty straightforward. Okay, so what's the difference?


<a id="org515cc44"></a>

## Unbuffered

The unbuffered channel can receive any number of values. We can send any number of values over an unbuffered channel.
Does that mean we can just dump a bunch of values in this channel and forget about it? Absolutely not!

<p class="highlighted-boxed-section">To send anything on an unbuffered channel, there has to be at least one receiver somewhere.</p>

Why?

Sending doesn't happen unless we ready to receive. It's a simple as that. Let's try an example.

The following [Go playground](https://go.dev/play/p/o9gF8kn4Eyz) fails with a panic, indicating that all goroutines are asleep and we have deadlock.

    func main() {
      ch := make(chan int)
      ch <- 1
    }

This means that `main` is waiting until a receive on `ch` is ready **somewhere**, but the Go runtime can tell there aren't any other goroutines active, so there can't possibly be a goroutine that might
be setting up a receiver to `ch`. So how do we clean this up? By setting up a receiver!

What do you think will happen if we add a receiver at the bottom of our `main` function?

    func main() {
      ch := make(chan int)
      ch <- 1
      fmt.Println(<-ch)
    }

If you guessed deadlock again, get yourself a cookie. The send is still blocking! That means that the receiver is never executed, and we have no more active goroutines yet again.
So how do you set up a receiver before a sender? Using a goroutine!

    func main() {
      ch := make(chan int)
      go func() {
        fmt.Println(<-ch)
      }()
      ch <- 1
    }

Now we spin up a goroutine receiver waiting for a value to be ready on `ch`, then send a value to `ch`. Here's another quiz for you &#x2013; will it print `1`?
The answer is, "sometimes." The `main` routine exits after sending the value across the channel, but the goroutine is going to print as soon as it gets a value
from the channel. So sometimes the `main` routine exits before the print happens, sometimes it happens after. To guarantee that the print statement happens, we can either use a
`sync.WaitGroup` or another channel. Since this blog post is about channels and channels only, the following example will use channels.

    func main() {
      ch := make(chan int)
      done := make(chan struct{}{})
      go func() {
        fmt.Println(<-ch)
        done <- struct{}{}
      }()
      ch <- 1
      <-done
    }

Now the `main` routine waits to receive a value on the `done` channel, and the spawned goroutine sends a value on the `done` channel only after printing. Voila!


<a id="orgcdc7ac0"></a>

## Buffered

A buffered channel is a channel that is created with a specific capacity. The channel can be filled up to the capacity (even without receivers ready!) but once it's full, all sends will be
blocked until some values are popped off the channel.

Let's see what that means in practice.

    func main() {
      ch := make(chan int, 1)
      ch <- 1 // notice this is fine here but would block in the unbuffered
      fmt.Println(<-ch)
    }

Pretty nifty! What if we try to send past the buffer capacity?

    func main() {
      ch := make(chan int, 1)
      ch <- 1 // notice this is fine here but would block in the unbuffered
      ch <- 2
      fmt.Println(<-ch)
    }

Uh oh &#x2013; deadlock. The channel is already filled to capacity. Let's try something else.

    func main() {
      ch := make(chan int, 1)
      ch <- 1 // notice this is fine here but would block in the unbuffered
      go func() {
        ch <- 2
      }()
      fmt.Println(<-ch)
      fmt.Println(<-ch)
    }

First we put a value on the channel, then start a goroutine that tries to put a value on the channel but can't because it's full. Then we read a value off the channel, opening up a slot which our goroutine immediately takes.
Then we read another value off the channel. Beautiful!

<p class="technical-popout">Technically speaking, all sends and receives on channels are blocking.  Sends block until there is a corresponding receive, and receives block until a value can be read.
Buffering a channel opens up room for sends without the receive syntax we're used to, but really the buffer is receiving the value. If the buffer is full, nothing is receiving the value,
which is what makes the operation blocking.</p>


<a id="org9ec1d7a"></a>

## Which one to choose

This is hard, and often disputed. I like to stick to the [Uber style guide](https://github.com/uber-go/guide/blob/master/style.md#channel-size-is-one-or-none) and say that "channel size is one or none," but even that is subject to change on
specific use cases (e.g. rate limiting). I wish there were a hard and fast rule for picking the right kind of channel, but unfortunately it varies too
widely in actuality.


<a id="orgf635c2e"></a>

# Closing

Closing a channel is pretty dead simple.

<p class="smaller highlighted-boxed-section">For this section I use buffered channels to avoid spawning goroutines, but all of these examples can be adjusted to work with unbuffered channels.</p>

    func main() {
      ch := make(chan int, 1)
      ch <- 1
      fmt.Println(<-ch)
      close(ch)
    }

Closing a channel means that the channel can no longer *receive* values. However, we can always read from a channel, even if that channel has been closed.

    func main() {
      ch := make(chan int, 1)
      ch <- 1
      close(ch)
      fmt.Println(<-ch)
    }

Remember how reading from a channel blocks until there are values on the channel? Hopefully this doesn't wrinkle your brain.

    func main() {
      ch := make(chan int, 1)
      ch <- 1
      fmt.Println(<-ch)
      close(ch)
      fmt.Println(<-ch)
    }

This shows us an important concept in channels.

<p class="highlighted-boxed-section">Reading from an empty closed channel will always yield the zero value of the channel's underlying type.</p>

You might be thinking, "If I can always read from a channel, how do I know if it's closed?" Great question, and one that the authors of Go answered.
Reading off a channel actually gives us two values, we just often ignore the second one. The second `bool` return value of the channel tells us if the channel is closed or not.

    func main() {
      ch := make(chan int, 1)
      ch <- 1
      v, ok := <-ch
      fmt.Println("v", v, "ok", ok)
      close(ch)
      v, ok = <-ch
      fmt.Println("v", v, "ok", ok)
    }

<p class="smaller highlighted-boxed-section">One important thing to note is that attempting to send on a closed channel results in a panic. Because of that, we always want the <strong>sender</strong> to close the channel.
<strong>Never</strong> close the channel on the receiving end.</p>


<a id="org70eefce"></a>

# Ranging over channels

Ranging over channels is probably the most common operation to do on a channel, alongside `select` (which is covered later).


<a id="orgeef73cb"></a>

## How it works

When we range over a channel, we continuously read values off the channel until the channel is closed. If the channel is never closed, the range loop goes forever.

Let's check it out.

    func main() {
      ch := make(chan int)
    
      go func() { // start a goroutine so we don't deadlock
        for i := 0; i < 10; i++ {
          ch <- i
        }
      }()
    
      for v := range ch {
        fmt.Println(v)
      }
    }

There's a bug here. Our `range` operation runs forever, and the runtime can tell that there's no more goroutines so nothing is going to send any more values over the channel.
Ruh roh. We can avoid this by closing our channel after we're done sending.

    func main() {
      ch := make(chan int)
    
      go func() { // start a goroutine so we don't deadlock
        for i := 0; i < 10; i++ {
          ch <- i
        }
        close(ch)
      }()
    
      for v := range ch {
        fmt.Println(v)
      }
    }

Awesome. Now we have a way of looping over the values in an unbuffered channel, getting the values and doing something with them, then stopping the loop once the channel is closed.
This is fantastic. We love this.


<a id="orga58d5f9"></a>

# Select

The select statement operates kind of like a `switch` statement, except with channels. `select` also
blocks until one of the options is available. There is a `default` option which is **always** available.

    func randSleep() struct{} {
      now := time.Now()
      defer func() {
        fmt.Println("slept for", time.Since(now).String())
      }()
    
      dur := rand.Intn(500)
      time.Sleep(time.Duration(dur) * time.Millisecond)
      return struct{}{}
    }
    
    func main() {
      ch1 := make(chan struct{})
      ch2 := make(chan struct{})
    
      go func() {
        ch1 <- randSleep()
      }()
    
      go func() {
        ch2 <- randSleep()
      }()
    
      select {
      case <-ch1:
        fmt.Println("1 wins!")
      case <-ch2:
        fmt.Println("2 wins!")
      }
    }

Whichever channel gets the value first is the winner.

You can use the `select` statement to enforce timeouts or avoid performing operations if something is done.

    func foo(maybeDontRun chan struct{}) {
      /* some other code */
      select {
      case <-maybeDontRun:
        return
      default:
        reallyExpensiveOperation()
      }
    }

    func foo() {
      select {
      case res <-expensiveOp():
        fmt.Println(res)
      case time.After(1 * time.Second()):
        fmt.Println("exceeded deadline")
      }
    }

Note that the second example does not actually cancel the execution of `expensiveOp`. If you want to propagate downstream cancellations, use a `context.Context`.


<a id="org2bc0f59"></a>

# Putting it all together

If you're anything like me, it's hard to think about this concept without some concrete examples. I highly recommend checking out [this codewalk](https://go.dev/doc/codewalk/sharemem/) put together by the Go authors.
The codewalk highlights a Go proverb you will undoubtedly hear time and again,

<p class="highlighted-boxed-section">Don't communicate by sharing memory, share memory by communicating.</p>

If that confuses you, don't worry, it confused me too. The gist is, "Don't pass around pointers and structs everywhere, use channels to pass around those things."


<a id="orgc4bc6fd"></a>

## Error groups     :ARCHIVE:

