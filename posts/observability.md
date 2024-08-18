---
title: Let's talk about observability
date: '2024-05-25'
description: "Logs, traces, and metrics. Oh my!"
---
# Table of Contents

<!-- TOC -->
* [Logs](#logs)
  * [Leveled logs](#leveled-logs)
    * [Leveled logs in action](#leveled-logs-in-action)
  * [Attributes](#attributes)
    * [Attributes in action](#attributes-in-action)
  * [Pros of logs](#pros-of-logs)
  * [Cons of logs](#cons-of-logs)
* [Traces](#traces)
  * [Pros of traces](#pros-of-traces)
  * [Cons of traces](#cons-of-traces)
* [Metrics](#metrics)
  * [Cardinality](#cardinality)
    * [Low cardinality is important](#low-cardinality-is-important)
    * [Metrics are cost-effective?](#metrics-are-cost-effective)
  * [Types of metrics](#types-of-metrics)
  * [Pros of metrics](#pros-of-metrics)
  * [Cons of metrics](#cons-of-metrics)
* [Summary](#summary)
* [Further reading](#further-reading)
<!-- TOC -->

# Let&rsquo;s talk about observability

Observability is the concept of seeing what&rsquo;s going on inside our system.
Most of the time, we do this by writing some code that gives back meaningful data about the state of something, like an HTTP request or a CronJob.
The often dubbed &ldquo;three pillars of observability&rdquo; will be the focus of this blog &#x2013; logs, traces, and metrics. Each pillar has its pros and cons, as well as patterns and anti-patterns.

Examples will be written in Go, but your language of choice almost definitely has an observability package for you to play with.


<a id="org037a22e"></a>

## Logs

Our oldest and dearest friend, the log, is the entrypoint into observable data. There are [countless](https://www.reddit.com/r/ProgrammerHumor/comments/ntro76/all_the_print_statements/) [memes](https://www.reddit.com/r/ProgrammerHumor/comments/g0o1x3/the_holy_print_statement/) [about](https://programmerhumor.io/debugging-memes/print-breakpoints/) [print](https://www.facebook.com/compscimeme/photos/when-you-dont-have-time-to-use-the-debugger-but-you-spend-5-hours-writing-print-/622761868096940/?paipv=0&eav=AfbGtIEgYm94oW-55vfBT9qpZ92QIKTnl2yUwiCCUrdortEOWs2tC3I7FfMc1lb_Krs&_rdr) [statements](https://www.reddit.com/r/ProgrammerHumor/comments/9hlqyq/print_got_this_far/), highlighting the ubiquity of `console.log` or `print` or the cursed Java `System.out.println`. These statements are often bare bones, development-only implementations that output tidbits of information at critical points of the business logic or control flow. Something like

```go
fmt.Printf("found user: %v\n", user.ID)
```

is a classic example of a great development-level log.

We know if this is statement appears in `stdout`, we found a user, and we also get the user ID on screen. 
Perfect for when we trigger execution of the function so that we can easily inspect it. However, in production, this log is not as valuable.
First, we don&rsquo;t exactly know where this happened - there could be lots of places in our code that find users. 
Second, this chunk of logs will likely be surrounded by logs from other parts of the system. 
It would be incredibly difficult to find this simple log in a vast sea of other simple logs. 
So how do we reconcile having a log statement that is helpful in development but not as helpful in production?

### Leveled logs

Leveled logging is the practice of assigning levels of importance to logs. Logs at lower levels are *less critical* than logs at higher levels.
Leveled logs provide two major niceties:

1.  The level is (generally) printed along with the log.
2.  Log aggregates in production can selectively exclude logs below a certain level, at either the time of search, ingestion, or both.

Log levels are relatively standardized. From low to high, the most common levels are:
* `DEBUG`
* `INFO`
* `WARN`
* `ERROR`

with some implementations having a `FATAL` at the highest level. 

#### Leveled logs in action

This example will use Go's `slog` package from the standard library. In all my projects, I use `slog` over third-party libraries,
partially because I love using the stdlib, and partially because I know that Go's [promise of backwards compatibility](https://go.dev/doc/go1compat) means that I won't have
to go back and change anything due to broken APIs. It's also just a really cool library with some super slick extensibility.

```go
package main

import (
	"fmt"
	"log/slog"
)

func main() {
	slog.Info("starting")
	for x := range 10 {
		if x%3 == 0 && isEven(x) {
			slog.Warn(fmt.Sprintf("encountered even number divisble by 3: %d", x))
			break
		}
	}
}

func isEven(x int) bool {
	slog.Debug(fmt.Sprintf("checking %d", x))

	res := x%2 == 0

	slog.Debug(fmt.Sprintf("result: %t", res))
	return res
}
```
<small><a target='_blank' href="https://go.dev/play/p/IWX1DoGZZj7">playground link</a></small>

This clearly contrived example loops over numbers 1 to 9, checking if a number is divisible by 3 and if that number is also even.
We log at the `INFO` level on starting, and then each call to `isEven` has a `DEBUG` level log, giving us some details about the arguments to the function
and the result. If we encounter an even number divisible by 3, we `WARN` that we have hit that condition, and we stop looping.

Here's the output (ignore the timestamps, the playground's runtime is fixed to a certain time):
```
2009/11/10 23:00:00 INFO starting
2009/11/10 23:00:00 WARN encountered even number divisble by 3: 6
```
What the hell? Why are there no `DEBUG` calls? 

Turns out, the `slog` default logger is set to only care about `INFO` level calls and above, as detailed by the documentation. 
I definitely read the documentation. I definitely didn't spend way too long wondering where my calls went. Yeah, definitely not.

Like I mentioned before, the level information on a log gives a lot of power to the logger, as well as the aggregator, the thing that is 
receiving the logs. For `slog`, the logger doesn't even bother sending the logs to the aggregator (`stdout` in the example)
if they're below the level we care about.

### Attributes

Loggers become even more powerful sources of information when you consider attributes, which are key-value pairs that hold information.
Modern logger implementations allow you to build up new loggers with new attributes that are included on **every log called with that logger.**
This is an _extremely_ powerful concept. 

Attributes are so friggin great that they are not just limited to loggers. We will see them again in traces and metrics.

#### Attributes in action

Returning to our example with `slog`, let's make it way nicer. Our output is going to look different, because
I'm going to use a JSON handler, so that we can more easily see the attributes.

```go
package main

import (
	"log/slog"
	"os"
)

func main() {

	// make a JSON handler that writes to stdout and includes logs from level `DEBUG` and above
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})

	// make a new logger that uses the handler
	log := slog.New(h)

	log.Info("starting")
	for x := 1; x < 10; x++ {
		// `log.With` returns a new logger, so we shadow to leave the outer `log` unchanged
		log := log.With(slog.Int("num", x))
		if x%3 == 0 && isEven(log, x) {
			log.Warn("encountered even number divisble by 3")
			break
		}
	}

	log.Info("done") // does not include attributes added during the loop
}

// isEven now takes a logger as well as the arg
func isEven(log *slog.Logger, x int) bool {
	res := x%2 == 0
	log.Debug("checked", slog.Bool("is_even", res)) // one-off attribute inclusion
	return res
}
```
<small><a target='_blank' href="https://go.dev/play/p/ca-prOKDDbv">playground link</a></small>

Already that is looking **much** better. The output is also very pleasing:
```
{"time":"2009-11-10T23:00:00Z","level":"INFO","msg":"starting"}
{"time":"2009-11-10T23:00:00Z","level":"DEBUG","msg":"checked","num":3,"is_even":false}
{"time":"2009-11-10T23:00:00Z","level":"DEBUG","msg":"checked","num":6,"is_even":true}
{"time":"2009-11-10T23:00:00Z","level":"WARN","msg":"encountered even number divisble by 3","num":6}
{"time":"2009-11-10T23:00:00Z","level":"INFO","msg":"done"}
```

Note how we build up a logger by adding relevant chunks of info that are included on the calls with that logger. 
If we had several deeply nested calls, each is only responsible for depositing its relevant information on the logger and
passing it along, leading to contextual information being included on all print statements. I think that's pretty nifty.

This concept is not unique to Go. Loggers without progressive attribute inclusion are like a function called `isEven` -- probably not suitable for production.

In the real world, we would have some way of configuring the level of logs based on environments, so that local development 
environments see `DEBUG` calls, and deployed environments see `INFO` (or even `WARN`) and above only. 

### Pros of logs

Logs just make sense. They are text-based information that is easy to create and easy to search. You can freely
type whatever you want, so there is very little you have to keep in your head. 

Logs are easy to reason about. You type something in your code, it shows up on the screen plus a little extra info.

### Cons of logs

It's incredibly difficult to follow a single request using just logs. All logs are intermixed with other logs, so the noise is overwhelming.
Some people reach for a `request_id` attribute, which lessens the problem, but doesn't eliminate it entirely.

Logs don't give you the full picture. They are one or more statements about a specific state at a specific time.

You have to know what you want ahead of time. It's really, really, really hard to know what is and what is not important 
on your first implementation. Most people default to including everything, which is perfectly sensible but not very practical.

## Traces

Traces are high-definition timings, made up of nested spans, that show a detailed breakdown of a process. Here's a screenshot
of a trace as represented on [honeycomb.io](https://honeycomb.io), a trace aggregator. 

![img.png](https://www.honeycomb.io/wp-content/uploads/2022/10/distributed-tracing-prod-illustration_tablet.svg)

You can see that there are nested spans, and that child spans are fully contained by their parents.

Using traces, you can see which spans are generated by certain calls, what those spans' attributes are, and how long those spans took.
Traces are incredible for identifying bottlenecks, highlighting use-cases, and in-depth analysis of what your runtimes look like in production.

Traces inherently provide contextual information due to their parent-child relationships, so the actual implementation is much easier.
You simply create a span, and if that span happens to be inside another, the Otel protocol takes care of making it associative. It's really
quite beautiful, and a lot of fun to work with.

I won't be going over the implementation of traces, because they vary widely depending on the language you're using, and because they're
pretty straightforward. Start a span when the function starts, add some attributes, end the span when the function ends. 

### Pros of traces
Traces are pretty easy to use, and they "just make sense," so they are much more readily useful.

They are one of the best ways to identify bottlenecks in your system.

Traces and spans make it **much** easier for a new team member to quickly make sense of something. I have found that my understanding of my _own_ applications
grew when I added traces, because it's difficult to keep a whole system in your head.

### Cons of traces
Hoo boy are traces expensive at scale. 

It takes practice to identify high-value spans, and is something that we all have to work constantly to improve.

They are more difficult to set up than logging, and (usually) require an aggregator to allow nice visualizations and searching.

## Metrics

Metrics are one-off calculations that are aggregated across time. They are a single value that represents something, like `http.request.count.total` representing
the lifetime number of requests you've received. At first glance, this isn't super useful, but once you consider that metrics are time-series information,
you can look at `http.request.count.total`'s rate of change to calculate the request rate in a given time period. 

Labels can provide useful information that qualifies the value, like a label `response_status` on `http.request.count.total`. 

### Cardinality

Cardinality is the total number of possible labels and their values for a metric. A metric `http.request.count.total` with no labels has a cardinality of `1`,
since it's just a number that goes up. If we add a label `response_status`, and we send two metrics, one with `200` and one with `403`, the cardinality is now `2`.
Many aggregators will in fact consider these **distinct metrics, because they are.**

<p className="callout">The format of the examples from here on out will be <br /><code>metric.name{label: value, other_label: value}(metric_value)</code>.</p>

1. `http.request.count.total{response_status: 200}(1)`
2. `http.request.count.total{response_status: 403}(1)`

We can query these metrics irrespective of status code to get the total count of `2`, or query them by status codes.

Now let's consider we add another label, like `path`.

1. `http.request.count.total{response_status: 200, path: '/login'}(1)`
2. `http.request.count.total{response_status: 403, path: '/home'}(1)`
3. `http.request.count.total{response_status: 200, path: '/home'}(1)`

We have three total requests, two with `200` responses, and one `403` response. We also have two `/home` calls and one `/login` call. 

Hopefully you're starting to see how labels can give _depth_ to metrics, making them incredibly value for observing your system over time.

#### Low cardinality is important

The total amount of possible values for a label is something that is important to consider, because metrics are cost-effective only when cardinality is low.
They are also much more valuable when cardinality is bounded, because they provide meaningful insights. Something like a `request_id` label on a metric is tempting,
but if included it would make the cardinality of that metric infinite. For every request, you'd have a new metric with a value of `1`. That's pretty worthless.

You'd also be paying out the wazoo. 

#### Metrics are cost-effective?

Consider the metric `http.request.count.total{response_status: 200, path: '/login'}(5583)`. We had 5,583 successful logins. To get that same
value from traces or logs, you'd have to have 5,583 individual traces or logs. The metric is **one** metric with a _value_ of 5,583. 

### Types of metrics

In general, you've got counters, up-down counters, and histograms. Counters go up, up-down counters go up and down, and histograms are for everything else.
In truth, histograms are a little more complicated than that, and I encourage you to read up on them, but if your metric can't fit in a counter or up-down counter,
you probably want a histogram e.g. `http.request.latency`. Latency in `ms` doesn't make any sense as a counter or up-down counter. 

### Pros of metrics
Metrics are cost-effective.

Metrics make sense, and are easy to implement. You simply increment a counter when something happens, or record a histogram value at the end of something.

Metrics provide a lot of valuable data that can lead to unrealized insights.

### Cons of metrics
There's an art to keeping cardinality low, and requires careful review by the team to make sure it's not running away.

It's hard to instantly know during development what metrics to include.

Labels have to be consistent across metrics if they are to be included in analysis, so some level of platform oversight is usually required.

## Summary

Observability is an incredibly valuable and important aspect of any system, and should absolutely be an iterative process. At the earliest stages of the project, logs will likely be the only source of observation.
Perhaps your team immediately can tell what metrics will be useful -- logins, concurrent user count, error rates. Eventually, your system becomes
large enough and complex enough that maybe it's time for traces. Along the way, you discover that you need more metrics or more refined metrics, so you refactor again.
The questions you need answers for become more complex, and so your observability implementation becomes more mature. In general, the things that grow and change
are metrics and logs, while traces are a one-and-done solution (aside from labels).

## Further reading

* [Otel, perhaps the most widely agreed-upon wire framework protocol for observability](https://opentelemetry.io/docs/)
* [ElasticSearch, an observability aggregator, most commonly used for logs but supports traces and metrics](https://www.elastic.co/elasticsearch)
* [DataDog, my personal favorite metrics aggregator](https://docs.datadoghq.com/)
* [Honeycomb, my personal favorite trace aggregator](https://www.honeycomb.io/)
* [Jaeger, a free trace aggregator that is incredibly easy to self-host and run locally](https://www.jaegertracing.io/)
* [Prometheus, a free self-hosted collector for metrics](https://prometheus.io/)
* [Grafana, a visualizer and aggregator for logs, traces, and metrics with a free tier](https://grafana.com/)




