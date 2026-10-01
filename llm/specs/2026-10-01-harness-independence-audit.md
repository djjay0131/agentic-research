# Harness Independence Audit - Agentic Research

Date: 2026-10-01
Status: Assessment and design input; implementation not started.
Depends on: Agentic Governance harness-independence architecture.

## Objective

Make Agentic Research execute consistently under Claude Code, OpenCode, Codex, CI, or future harnesses while preserving research integrity, reproducibility, provenance, citation verification, human review, and composition with Agentic Governance.

## Executive finding

Agentic Research already solved a major distribution problem: it replaced many copied .claude assets with one installed package and a per-repository research delta. That was the correct direction.

The remaining problem is that the package itself is a Claude Code plugin. The architecture centralized duplicated behavior but did not yet make the behavior harness-independent.

Strong portable assets already exist: the research delta, deterministic shell/Node scripts, LaTeX templates, citation/reference structures, memory/construction conventions, explicit agent responsibilities, and composition rules with Agentic Governance.

## Classification

| Current element | Classification | Target |
|---|---|---|
| Research delta | Core research protocol/config | Preserve and schema-validate |
| Paper/proposal/position workflows | Portable workflows | Extract from agent prose |
| Citation verification requirements | Research integrity policy | Provider-neutral verification |
| Originality checks | Portable research capability | Preserve limitations/evidence |
| research-checks.mjs | Deterministic capability | Run without LLM |
| Build/watch/wordcount/arXiv scripts | Deterministic tooling | Preserve |
| LaTeX templates | Portable assets | Preserve |
| research/agents/*.md | Portable role plus Claude metadata | Split canonical role from adapter |
| research/skills/*/SKILL.md | Portable operation plus Claude mechanics | Extract workflow semantics |
| Claude plugin manifests | Claude adapter | Claude distribution only |
| CLAUDE_PLUGIN_ROOT | Claude-only locator | Adapter-resolved framework_root |
| AskUserQuestion | Harness adapter | human.request_decision |
| research slash commands | Adapter invocation | Canonical operation IDs |
| CLAUDE.md.template | Claude bootstrap | Add portable AGENTS bootstrap |
| Consensus as Claude integration | Verification provider | Provider registry plus fallbacks |
| WebSearch/WebFetch | Harness-specific names | Portable web capability |
| GitHub Actions checks | CI executor | Expand independent verification |

## Specific coupling

### Installation lifecycle

The README requires Claude Code, Claude marketplace commands, session restart behavior, and Claude plugin upgrade workarounds. These are distribution concerns, not research semantics.

Target: installation is documented per adapter while framework/protocol versions remain common.

### Establish uses CLAUDE_PLUGIN_ROOT

research.establish copies templates and resolves version information relative to the Claude plugin root.

Target: establish asks the runtime for framework_root/package_root and remains otherwise unchanged.

### Agents use Claude tool declarations

Agent front matter declares allowed-tools such as Read, Write, Edit, Glob, Grep, and Bash. Some procedures depend on WebSearch/WebFetch or named integrations.

Target: canonical roles declare capabilities such as filesystem.read, filesystem.write, execution.command, web.search, scholarly.lookup, scm.comment, and verification.record. Each adapter maps these to native tools.

### Human interaction is a named Claude tool

Establish and preflight use AskUserQuestion.

Target: human.request_decision and human.request_input capabilities with harness-native implementations.

### Citation verification names a Claude integration

The review agent identifies Consensus as a Claude integration and then names harness-specific fallbacks.

Target: define scholarly-source verification requirements separately from providers. Provider priority can be configuration, for example Consensus -> Crossref/OpenAlex/arXiv -> web, with evidence recording which provider was used.

### Generated project instructions are Claude-named

The scaffold contains CLAUDE.md.template.

Target: generate AGENTS.md as the portable bootstrap. A Claude adapter may additionally generate CLAUDE.md; an OpenCode adapter can use its preferred native files. No research rule exists only in one generated harness file.

## Research-specific protocol extensions

Agentic Research should extend Agentic Governance with research capabilities rather than build another adapter stack.

Suggested capabilities:
- scholarly.lookup
- citation.verify_existence
- citation.verify_metadata
- citation.verify_support
- experiment.execute
- experiment.capture_environment
- dataset.record_provenance
- dataset.publish_or_link
- artifact.reproduce
- manuscript.compile
- manuscript.page_count
- originality.compare_sources

## Reproducibility as protocol

For generated datasets require:
- generating script or deterministic procedure;
- input manifest;
- configuration;
- random seed when randomness exists;
- environment/tool versions where material;
- downloadable or viewable data artifact link;
- provenance record.

For experiments require:
- runnable command;
- config;
- code revision;
- inputs/dataset versions;
- seeds;
- environment;
- preserved raw outputs;
- transformation/analysis scripts;
- verification evidence.

For derived figures and tables require the generating script, source data, exact command/config, and output location.

These requirements should be checked mechanically wherever possible.

## Research workflow objects

Current paper/proposal/position agents contain valuable workflow semantics. Move those semantics into canonical workflow definitions, with agents executing roles within them.

Candidate workflows:
- research-study
- experiment
- dataset-generation
- literature-review
- research-paper
- proposal
- position-paper
- citation-verification
- submission-review

Illustrative experiment lifecycle:

    design
      -> independent design review
      -> human gate where required
      -> execute
      -> capture raw evidence
      -> independent result verification
      -> analysis
      -> manuscript integration
      -> human review

The same DAG should execute regardless of harness.

## Agent portability

Canonical research roles should describe behavior rather than Claude mechanics: researcher, experiment-designer, experiment-runner, research-verifier, citation-verifier, paper-writer, proposal-writer, position-paper-writer, manuscript-reviewer, and memory-curator.

Existing paper-agent, proposal-agent, position-paper-agent, latex-agent, citation-agent, originality-agent, review-agent, and memory-agent provide source material for these contracts; they do not need to be discarded.

## Deterministic tooling is already a strength

The shell and Node scripts are naturally harness-neutral. They should become reference implementations of protocol capabilities and be callable by humans, agents, and CI.

This is also the model for the human verification tool: semantic review may require a human or independent agent, but the evidence package should be deterministic and reproducible.

## Composition with Agentic Governance

There should be one adapter/capability layer, owned by Agentic Governance or a shared runtime package. Agentic Research extends it.

    Agentic Governance Protocol
       |
       +-- common capabilities and adapters
       |
       +-- Agentic Research Extension
             research roles
             research workflows
             reproducibility policy
             provenance policy
             scholarly verification

Research should not implement separate Claude/OpenCode/Codex adapter stacks unless a research-only capability requires a small extension to the shared adapter interface.

## Cross-harness acceptance tests

A representative fixture should be scaffolded and operated under at least Claude Code and OpenCode. Both must produce semantically equivalent:
- research delta;
- repository layout;
- workflow stages and gates;
- citation evidence schema;
- reproducibility metadata;
- verification reports;
- human approval requirements.

Text formatting and native invocation syntax may differ. Governance and research meaning may not.

## Migration boundaries for planning

1. Adopt the Governance capability schema.
2. Define research capability extensions.
3. Schema-validate research-delta.
4. Extract agent semantics into canonical role definitions.
5. Extract paper/proposal/position and verification workflows.
6. Refactor establish/preflight/audit into provider-neutral operations.
7. Replace CLAUDE_PLUGIN_ROOT with runtime context.
8. Generate portable AGENTS bootstrap plus harness projections.
9. Abstract scholarly verification providers.
10. Expand deterministic reproducibility/provenance checks.
11. Add Claude/OpenCode conformance fixtures.
12. Preserve the current Claude plugin as the compatibility adapter until parity is demonstrated.

## Non-goals

This audit does not remove the Claude plugin, change current research workflows, replace existing agents, remove Consensus, or migrate consumer repositories. It defines the separation needed before implementation.

The implementation plan should be developed jointly with the Agentic Governance audit so there is one adapter architecture rather than two.
