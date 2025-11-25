# Kaizen-Solaris Rust Code Review System

**Unified review framework for technical excellence and sustainable teams**

## Overview

The Kaizen-Solaris code review system combines **Solaris-Class technical rigor** (100% coverage, zero unsafe tolerance, comprehensive testing) with **Toyota Way human-centered practices** (Kaizen, Nemawashi, Jidoka, Genchi Genbutsu, Hansei) to create a review process that achieves safety-critical quality while respecting people and fostering continuous improvement.

### What Makes This Different

Most code review standards focus exclusively on either:
- **Technical rigor** (leading to burnout and unsustainable practices), or
- **Team dynamics** (leading to compromised quality)

Kaizen-Solaris integrates both:

```
Technical Excellence + Respect for People = Sustainable High Performance
```

## Core Pillars

### 1. Continuous Improvement (Kaizen 改善)

Systems and code are never finished. Every review is an opportunity to learn, improve processes, and prevent future defects.

**Key Practices:**
- Metrics-driven improvement
- PDCA cycles (Plan-Do-Check-Act)
- 20% time for technical debt
- Regular retrospectives (Hansei)

### 2. Respect for People (人間性尊重)

Code review is collaboration, not gatekeeping. Reviews build understanding while maintaining sustainable workloads.

**Key Practices:**
- Nemawashi (consensus building)
- Constructive feedback (questions, not commands)
- Heijunka (level the workload)
- Team development focus

## Technical Standards Summary

### Memory Safety & Correctness
- **Zero unsafe tolerance** (default `#![forbid(unsafe_code)]`)
- SAFETY comments for all unsafe blocks
- Unsafe review group approval required
- Miri verification in CI
- Newtypes over primitives
- Make illegal states unrepresentable

### Comprehensive Testing
- **100% line coverage** target (measured with cargo-llvm-cov)
- **90%+ mutation kill rate** for critical modules
- Multi-layer strategy:
  - Unit tests (100% coverage)
  - Property-based tests (proptest/quickcheck)
  - Documentation tests (all examples work)
  - Fuzzing (input handlers)
  - Integration tests (real usage)
  - Formal verification (safety-critical)

### Security Hardening
- **Supply chain:** cargo-vet, cargo-audit, cargo-deny
- **Cryptography:** Vetted libraries only (ring, RustCrypto)
- **Input validation:** All boundaries
- **Secrets:** zeroize sensitive data
- **Defense-in-depth:** Multiple layers

### Code Quality
- **Zero warnings:** rustc + clippy (all lint groups)
- **Functions ≤60 lines,** complexity ≤10
- **Documentation:** All public APIs with examples
- **Error handling:** Result over panic
- **Performance:** Profile before optimizing

## Process Standards Summary

### Review Process (Nemawashi)
- **Two senior engineer approvals** required
- **Check out locally** (Genchi Genbutsu - go and see)
- **Review within 24 hours** (normal PRs)
- **PRs ~300 lines** (ideal), 500 max
- **Constructive feedback** (questions, alternatives, explanations)

### Stop-The-Line Quality (Jidoka)
- **Zero defect culture** - halt on quality issues
- **Five whys** root cause analysis
- **Quality gates** - no exceptions for merging
- **Prevention over detection** - build quality into process

### Continuous Improvement (Kaizen)
- **Quarterly Kaizen events** - focused improvement sessions
- **Metrics dashboards** - track trends over time
- **Technical debt register** - 20% time for repayment
- **Regular retrospectives** - learn and improve

### Reflection (Hansei)
- **Weekly team reflection** - 15 min Fridays
- **Post-incident reviews** - within 48 hours
- **Sprint retrospectives** - Start-Stop-Continue
- **Blameless culture** - focus on learning

## Quick Start

### For Teams Adopting This System

**Week 1: Foundation**
1. Read SKILL.md (all team members)
2. Set up CI/CD with static analysis tools
3. Configure rustfmt, clippy with all lints
4. Integrate cargo-audit and cargo-deny
5. Create review rotation schedule

**Week 2-4: Process Integration**
1. Implement two-engineer review requirement
2. Establish review turnaround expectations
3. Begin using comprehensive checklists
4. Set up metrics tracking dashboard
5. Conduct first team Hansei session

**Ongoing: Continuous Improvement**
1. Weekly team Hansei (15 min)
2. Sprint retrospectives (60 min)
3. Quarterly Kaizen events (2-4 hours)
4. Post-incident Hansei (as needed)
5. Monthly metrics review

### For Reviewers

**Pre-Review:**
1. Check out code locally (don't just read on GitHub)
2. Run tests and verify they pass
3. Review CI checks
4. Understand context (read PR description and issues)

**During Review:**
1. Safety first (memory safety, security)
2. Correctness second (logic, error handling)
3. Testing third (coverage, test quality)
4. Quality fourth (readability, docs)
5. Performance last (only if relevant)

**Provide Feedback:**
- Ask questions, don't command
- Explain the "why"
- Distinguish must-fix / should-fix / nice-to-have
- Praise good solutions
- Be constructive and educational

### For Authors

**Before Creating PR:**
1. Self-review your diff
2. Run tests locally (all pass)
3. Check coverage (≥90% for new code)
4. Run static analysis (zero warnings)
5. Size appropriately (~300 lines)
6. Write clear description (what/why/how)

**Responding to Feedback:**
1. Acknowledge all comments
2. Ask clarifying questions
3. Implement must-fix items first
4. Discuss alternatives for should-fix
5. Explain your reasoning

## File Organization

```
kaizen-solaris-review/
├── SKILL.md                          # Main skill file with core guidance
├── README.md                         # This file
├── resources/                        # Detailed resource files
│   ├── memory-safety.md             # Memory safety standards
│   ├── testing-strategy.md          # Comprehensive testing guide
│   ├── security-hardening.md        # Security practices (to be created)
│   ├── code-quality.md              # Quality standards (to be created)
│   ├── static-analysis.md           # Tools & CI integration (to be created)
│   ├── error-handling.md            # Error discipline (to be created)
│   ├── performance.md               # Optimization patterns (to be created)
│   ├── review-process.md            # Review workflow & Nemawashi
│   ├── continuous-improvement.md    # Kaizen & Hansei practices
│   └── checklists.md                # Ready-to-use checklists
└── automation/                       # CI/CD templates (to be created)
    ├── github-actions/
    │   ├── review-checks.yml
    │   └── quality-gates.yml
    └── pre-commit-hooks/
        └── rust-quality-check.sh
```

## Context-Specific Adaptations

### Startups / Rapid Development

**Start with essentials:**
- Forbid unsafe code
- 80% coverage minimum
- Basic static analysis
- Single reviewer for low-risk

**Maintain:**
- Zero-defect culture
- Stop-the-line mindset

### Safety-Critical Systems

**Enhance:**
- 100% coverage mandatory
- Formal verification for critical paths
- All unsafe formally verified
- Complete traceability

### Libraries / Frameworks

**Emphasize:**
- API design review
- Comprehensive docs
- Semantic versioning
- Property-based tests

### Embedded / Real-Time

**Enforce:**
- `no_std` mode
- Static allocation
- Bounded execution time
- Hardware testing

## Success Metrics

### Technical Quality
- Code coverage ≥90% (target 100%)
- Mutation kill rate ≥90% (critical modules)
- Static analysis warnings = 0
- Build time \u003c5 minutes
- Test execution \u003c5 minutes

### Process Quality
- Review turnaround \u003c24 hours (median)
- Defect escape rate → 0
- Team satisfaction \u003e4/5 (survey)

### Learning & Improvement
- Retrospectives with tracked action items
- Process improvements quarterly
- All engineers trained on standards

## Resources

### Documentation
- **[SKILL.md](SKILL.md)** - Complete skill with quick reference
- **[Checklists](resources/checklists.md)** - Ready-to-use review checklists
- **[Memory Safety](resources/memory-safety.md)** - Unsafe code standards
- **[Testing Strategy](resources/testing-strategy.md)** - Multi-layer testing
- **[Review Process](resources/review-process.md)** - Nemawashi workflow
- **[Continuous Improvement](resources/continuous-improvement.md)** - Kaizen & Hansei

### External References
- [The Rust Nomicon](https://doc.rust-lang.org/nomicon/) - Unsafe Rust
- [The Rustonomicon](https://doc.rust-lang.org/stable/reference/) - Language reference
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) - API design
- [Comprehensive Rust](https://google.github.io/comprehensive-rust/) - Google's course
- [Toyota Way](https://www.toyota-global.com/company/vision-and-philosophy/production-system/) - Philosophy

### Tools
- [cargo-llvm-cov](https://github.com/taiki-e/cargo-llvm-cov) - Code coverage
- [cargo-mutants](https://github.com/sourcefrog/cargo-mutants) - Mutation testing
- [Miri](https://github.com/rust-lang/miri) - UB detection
- [proptest](https://github.com/proptest-rs/proptest) - Property-based testing
- [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz) - Fuzzing
- [cargo-audit](https://github.com/rustsec/rustsec) - Vulnerability scanning
- [cargo-vet](https://mozilla.github.io/cargo-vet/) - Supply chain auditing
- [Kani](https://github.com/model-checking/kani) - Formal verification
- [Loom](https://github.com/tokio-rs/loom) - Concurrency testing

## Philosophy in Practice

### The Balance

```
Technical Rigor          Respect for People
     ↓                           ↓
Zero Tolerance    ←──────→    Sustainable
for Defects                    Workloads
     ↓                           ↓
Safety-Critical   ←──────→    Collaborative
Quality                        Culture
     ↓                           ↓
    Excellence Through Balance
```

### Core Beliefs

1. **Perfect code is asymptotic** - We never reach it, but continuously move toward it
2. **Right process → right results** - The Toyota Way teaches us this
3. **Stop the line for quality** - Jidoka prevents defects from propagating
4. **Respect creates excellence** - Burned-out teams cannot produce reliable software
5. **Learning never stops** - Hansei and Kaizen make us better every day

### What This Looks Like

**Good Day:**
- PR reviewed thoughtfully within 18 hours
- Reviewer finds subtle bug with constructive feedback
- Author learns new pattern, implements improvement
- Tests added to prevent recurrence
- Knowledge shared across team
- Everyone goes home on time

**Kaizen Day:**
- Quarterly improvement session identifies bottleneck
- Team brainstorms solutions collaboratively
- Small process change implemented
- Metrics show improvement two weeks later
- Success celebrated, learning documented
- Continuous improvement culture strengthened

**Hansei Day (Post-Incident):**
- Blameless retrospective conducted
- Five whys reveals root cause
- Prevention measures identified
- Tests added, monitoring improved
- Team learns and grows stronger
- Process updated to prevent recurrence

## Contributing

This standard is itself subject to Kaizen (continuous improvement).

**To propose improvements:**
1. Open an issue describing the improvement opportunity
2. Provide data/examples supporting the change
3. Discuss with team to build consensus (Nemawashi)
4. Implement small, measurable change
5. Monitor impact (PDCA)
6. Standardize if successful

**Areas for future enhancement:**
- Additional resource files (security, performance, error handling, etc.)
- CI/CD automation templates
- Metrics dashboard examples
- Training curriculum
- Case studies from teams using this system

## License

This skill is part of the claude-code-infrastructure-showcase project.

## Acknowledgments

This system synthesizes best practices from:

- **Solaris kernel engineering** - Zero-tolerance quality standards
- **Toyota Production System** - Kaizen, Jidoka, Genchi Genbutsu, Nemawashi, Hansei
- **NASA Power of Ten** - Safety-critical development rules
- **Linux kernel** - SAFETY comment conventions
- **Google** - cargo-vet, Comprehensive Rust training, pragmatic guidelines
- **Microsoft** - API documentation standards
- **Mozilla** - Rust API guidelines, cargo-vet ecosystem
- **paiml extreme TDD** - Mutation testing, property-based testing at scale

Special thanks to the Rust community for building a language that makes many of these practices enforceable at compile time.

---

**Excellence through respect. Quality through process. Improvement through reflection.**

**始めましょう (Let's begin)** 🚀
