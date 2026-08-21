# Phase 14 — Transactions, locking and the race you already prevented

> **Group** The domain core · **Side** API · **Risk** high (3/3) · **Depends on** 06, 13

**Goal.** Understand concurrency properly, implement the application-level defence as well, and be able to explain what each layer buys you.

## Why this phase still exists

Phase 06 already made overlapping rentals impossible at the database level. So why do this at all? Three reasons. First, the constraint protects one invariant — it does nothing for the other multi-step operations you are about to write. Second, an interviewer will ask how you would solve this *without* Postgres range types, and "I would use MySQL and be stuck" is not an answer. Third, transactions are the foundation underneath the constraint, and you cannot explain one without the other.

## ACID, in your own words

- **Atomicity** — all of it happens or none of it does. Your registration in phase 07 relies on this.
- **Consistency** — constraints hold at commit. Your exclusion constraint is enforced here.
- **Isolation** — concurrent transactions do not see each other's uncommitted work. This is the one with settings, and the one worth understanding.
- **Durability** — once committed, it survives a crash.
- Be able to give a one-sentence example of each from your own code. Reciting the acronym is worthless; the examples are what count.

## Isolation levels and what they actually prevent

```
READ COMMITTED    ← Postgres default
    prevents dirty reads
    allows non-repeatable reads and phantoms

REPEATABLE READ
    same snapshot for the whole transaction
    Postgres also prevents phantoms here

SERIALIZABLE
    behaves as if transactions ran one at a time
    may abort with a serialization failure → you must retry
```

## The check-then-act problem, generally

Read a value, decide based on it, write. Between the read and the write another transaction can change the world. Availability check then insert is one instance; so is 'is this the last car', 'has this coupon been used', 'does this slug already exist'. Once you recognise the shape you see it everywhere, and there are exactly three ways to close it: a constraint, a lock, or an atomic operation.

## Pessimistic locking

```
DB::transaction(function () use ($carId, $period) {
    $car = Car::where('id', $carId)->lockForUpdate()->first();
    // SELECT ... FOR UPDATE — other transactions wait here

    $this->availability->assertFree($carId, $period);
    return Rental::create([...]);
});
```

## The trade-offs, which is what gets asked

- **Pessimistic** (`lockForUpdate`) — take the lock first, others wait. Correct and simple; costs throughput and can deadlock if two transactions take locks in different orders. Always acquire locks in a consistent order.
- **Optimistic** (a version column) — assume no conflict, check on write, retry on mismatch. Better throughput under low contention, more code, and the caller must handle retry.
- **Constraint-based** (phase 06) — let the database refuse it. No lock, no retry, no window. This is why it is the best answer *when the invariant can be expressed as a constraint*.
- Say which you used and why. "I used the constraint because it expresses the invariant exactly, and I keep the transaction and lock as defence in depth for the multi-step parts" is a complete senior answer.

## Keep transactions short

- Never call an external API inside a transaction. The lock is held for the length of someone else's outage.
- Never dispatch a queued job inside a transaction unless you use `afterCommit` — the worker can pick it up before the commit lands and read a row that does not exist yet. This is one of the most common real Laravel bugs, and phase 16 depends on getting it right.
- Do the reads you can outside the transaction; hold it only around the write.

## Prove it

Write a test that fires two concurrent booking attempts for the same car and range and asserts that exactly one succeeds and the other receives 409. In Pest you can do this with parallel processes, or by opening two database connections and interleaving them manually — the manual version teaches more. Without this test you are claiming you fixed it; with it, you have shown it.

## Warning

> A deadlock is not a bug you prevent entirely — it is a condition you detect and retry. Postgres detects deadlocks and aborts one transaction with SQLSTATE 40P01. Catch it, retry a bounded number of times with a short backoff, and log it. Code that assumes deadlocks never happen fails only under load, which is the worst time to find out.

## Tasks

- [ ] Write your own one-line example of each ACID property
- [ ] Wrap the booking in `DB::transaction` with `lockForUpdate`
- [ ] Catch 23P01 and 40P01 distinctly
- [ ] Bounded retry with backoff on deadlock
- [ ] Audit every transaction for external calls and job dispatch
- [ ] Use `afterCommit` for job dispatch
- [ ] Write the concurrent booking test
- [ ] Handle 409 in the client by refetching availability
- [ ] Write the concurrency ADR including the MySQL fallback

## Done when

Two simultaneous bookings produce exactly one rental and one 409, proven by an automated test — and you can explain the difference between pessimistic locking, optimistic locking and a constraint without notes.

## What this teaches

| Area | Skill |
| --- | --- |
| SQL | Transactions and ACID ★★★ |
| SQL | Isolation levels — what each prevents ★★★ |
| SQL | Pessimistic vs optimistic locking ★★★ |
| SQL | Deadlocks — detection and retry ★★★ |
| SQL | SELECT FOR UPDATE ★★★ |
| Laravel | DB::transaction, afterCommit ★★★ |
| Architecture | Check-then-act and how to close the window ★★★ |
| Interview | Explaining a hard bug you fixed ★★★ |

## Interview questions

**Q. Two people book the last car simultaneously — walk me through it.**

Both requests pass the availability check, because neither has written yet. One insert then succeeds and the other is rejected by the exclusion constraint with SQLSTATE 23P01, which I map to 409 along with the remaining free cars. I also wrap the operation in a transaction with a row lock, so the multi-step parts are protected too. There's a test that fires both concurrently and asserts exactly one wins.

**Q. How would you solve this on MySQL, without range types?**

Transaction plus SELECT FOR UPDATE on the car row, with the availability check inside the lock. It's correct but weaker — the guarantee lives in my application code rather than the schema, so anything writing outside that path can still create an overlap.

**Q. What's the risk of dispatching a job inside a transaction?**

The worker can pick the job up before the transaction commits and query for a row that isn't visible yet. Laravel's afterCommit handles it by deferring dispatch until commit — without it you get intermittent failures that only appear under load.

## Search terms

- database isolation levels explained
- select for update postgres
- optimistic vs pessimistic locking
- laravel transactions afterCommit queue
