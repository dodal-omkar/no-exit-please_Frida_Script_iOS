# no-exit-please (iOS) 🛑

A universal Frida script to **bypass application self-termination**
at both Objective-C and native levels on iOS.

Designed for penetration testing, ethical hacking, reverse engineering,
bug bounty and dynamic analysis of iOS applications that intentionally 
terminate when security checks (jailbreak detection, tampering, instrumentation)
are triggered.

---

## The Problem

Many iOS applications implement defensive logic such as:

Jailbreak detection
Debugger detection
Instrumentation detection
Tamper detection

When a risky condition is detected, the common enforcement strategy is:

Throw exception → call abort/exit → terminate process

Instead of enforcing security server-side or cryptographically,
apps often rely on **process termination as enforcement**.

If the app cannot exit, the protection collapses.

---

## What This Script Does

`no_exit_please_ios.js` bypasses termination-based enforcement by
intercepting:

### Native termination paths
- `exit`
- `_exit`
- `abort`
- `kill`
- `pthread_exit`
- `__assert_rtn`

### Objective-C / runtime termination mechanisms
- `UIApplication - terminateWithSuccess`
- `NSException - raise`
- `objc_exception_throw`

Detection may still execute - but it no longer achieves its intended outcome.

**The process stays alive.**

---

## Why This Works

Many iOS security implementations assume:

> "If a risky condition is detected, the app can safely terminate."

That assumption fails when termination paths are hooked.

By blocking exit calls:
- Jailbroken environments remain usable
- Instrumentation continues uninterrupted
- Exceptions no longer crash the app
- Anti-debug or assert-based crashes lose impact

This shifts the engagement from bypassing dozens of checks
to neutralizing their enforcement mechanism.

It targets the **response**, not the detection.

---

## Features

### Native-Level Hooks (libSystem)
- `exit`
- `_exit`
- `abort`
- `kill`
- `pthread_exit`
- `__assert_rtn`

These are commonly used for hard process termination or assertion-based crashes.

### Objective-C Runtime Hooks

- `UIApplication - terminateWithSuccess`
- `NSException - raise`
- `objc_exception_throw`

These intercept exception-driven or runtime-triggered crash flows.

---
## In Action

<img width="1913" height="526" alt="image" src="https://github.com/user-attachments/assets/e5ec902a-7c50-4f5b-b1bc-2a918b072cde" />


---

## Usage

### Spawn and hook (recommended)

```bash
frida -U -f com.target.app -l no_exit_please_ios.js
```

```bash
frida -U -N com.target.app -l no_exit_please_ios.js
```
